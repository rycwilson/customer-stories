
class User < ApplicationRecord
  # RYAN = self.find_by(email:'rycwilson@gmail.com')

  belongs_to :company, optional: true
  # validates :first_name, :last_name, :email, presence: true
  validates :phone, format: { without: /_/ }
  # validate correct format OR empty string

  # removed to allow for non-linkedin profiles:
  # validates :linkedin_url, format: { with: /(\Ahttps:\/\/www.linkedin.com\/|\A(?![\s\S]))/,
  #                                    message: 'must begin with "https://www.linkedin.com/"' }

  # photo_url validation is handled on the front-end for now.
  # due to S3 presence (?), server-side validation failures of photo_url
  # open a devise view (not what we want)
  # validates :photo_url, format: { without: /\s/ }

  # a User can have his own contribution(s) (i.e. he is contributor),
  # or he can be the Referrer for contribution(s)
  has_many :own_contributions, class_name: 'Contribution', foreign_key: 'contributor_id', dependent: :destroy
  has_many :referred_contributions, class_name: 'Contribution', foreign_key: 'referrer_id'

  has_many :successes, class_name: 'Success', foreign_key: 'curator_id' # curator, no (dependent: :destroy)
  has_many :stories, through: :successes

  after_update_commit do 
    dont_publish_as_contributor if linkedin_profile_removed?

    photo_was_updated = previous_changes.keys.include?('photo_url') && previous_changes[:photo_url].first.present?
    if photo_was_updated
      S3Util::delete_object(S3_BUCKET, previous_changes[:photo_url].first)
    end
    
    # expire cache
    # Company
      # .joins(:curators)
      # .joins(:contributions)
      # .distinct()
      # .where('users.id = ? OR contributions.contributor_id = ? OR contributions.referrer_id = ?', self.id, self.id, self.id)
      # .each do |company| 
        # company.expire_ll_cache('successes-json', 'contributions-json') 
      # end
  end
  
  after_commit(on: [:update]) { expire_published_contributor_cache } if Proc.new do |user|
      trigger_keys = ['first_name', 'last_name', 'linkedin_url', 'linkedin_title', 'linkedin_photo_url', 'linkedin_company', 'linkedin_location']
      (user.previous_changes.keys & trigger_keys).any?
    end

  # for changing password
  attr_accessor :current_password

  # Adding signup code for beta control
  attr_accessor :sign_up_code
  validates(:sign_up_code, on: :create, presence: { message: "can't be blank" }, inclusion: { in: ['csp_beta'], message: 'is invalid' })

  attr_accessor :skip_callbacks

  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable, :recoverable, :rememberable, :trackable, :validatable, :lockable, :confirmable
  
  # doorkeeper
  devise :doorkeeper
  has_many :access_grants, class_name: "Doorkeeper::AccessGrant", foreign_key: :resource_owner_id, dependent: :delete_all # or :destroy if you need callbacks
  has_many :access_tokens, class_name: "Doorkeeper::AccessToken", foreign_key: :resource_owner_id, dependent: :delete_all # or :destroy if you need callbacks

  def full_name
    if first_name.present? and last_name.present?
      first_name + " " + last_name
    else 
      nil
    end
  end

  def linkedin_data_present?
    self.linkedin_title.present? &&
    self.linkedin_company.present? &&
    self.linkedin_photo_url.present?
  end

  def dont_publish_as_contributor
    self.own_contributions.each { |c| c.update(publish_contributor: false) }
  end

  def expire_published_contributor_cache
    # self.own_contributions.each do |contribution|
    #   if contribution.publish_contributor? && contribution.story.present?
    #     contribution.story.expire_published_contributor_cache(self.id)
    #   end
    # end
  end

  def missing_info
    missing = []
    missing << "first name" unless self.first_name.present?
    missing << "last name" unless self.last_name.present?
    missing << "photo" unless self.photo_url.present?
    missing << "phone" unless self.phone.present?
    missing << "title" unless self.title.present?
    missing
  end

  # This is for users signing up via Oauth
  # Not presently using this, but may in the future
  # def self.create_from_omniauth auth
  #   create! do |user|
  #     user.provider = auth["provider"]
  #     user.uid = auth["uid"]
  #     # user.name = auth["info"]["nickname"]
  #   end
  # end

  def linkedin_profile_removed?
    self.previous_changes[:linkedin_url].try(:[], 1).blank?
  end

  def curator_name_with_stories_count
    return '' unless self.company 
    "#{self.full_name} (#{self.stories.count})"
  end
end
