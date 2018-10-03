# TODO: check validations - client and server side
# use Bootstrap Validator on client side if necessary
class User < ApplicationRecord
  # RYAN = self.find_by(email:'***REMOVED***')

  belongs_to :company
  validates :first_name, presence: true
  validates :last_name, presence: true
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

  # if user doesn't have a linkedin_url, unpublish any contributions
  after_commit :update_contributions, on: :update

  after_commit(on: [:update]) { expire_published_contributor_cache } if Proc.new do |user|
      trigger_keys = ['first_name', 'last_name', 'linkedin_url', 'linkedin_title', 'linkedin_photo_url', 'linkedin_company', 'linkedin_location']
      (user.previous_changes.keys & trigger_keys).any?
    end

  # for changing password
  attr_accessor :current_password

  # Adding signup code for beta control
  attr_accessor :sign_up_code
  validates(:sign_up_code, on: [:create], presence: true, inclusion: { in: ["csp_beta"] })

  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :lockable#, :confirmable
  devise :doorkeeper

  # doorkeeper
  has_many :access_grants, class_name: "Doorkeeper::AccessGrant", foreign_key: :resource_owner_id, dependent: :delete_all # or :destroy if you need callbacks
  has_many :access_tokens, class_name: "Doorkeeper::AccessToken", foreign_key: :resource_owner_id, dependent: :delete_all # or :destroy if you need callbacks

  def full_name
    self.first_name + " " + self.last_name
  end

  def linkedin_data_present?
    self.linkedin_title.present? &&
    self.linkedin_company.present? &&
    self.linkedin_photo_url.present?
  end

  def company_registered?
    self.company_id.present?
  end

  def update_contributions
    if self.linkedin_url.blank?
      self.own_contributions.each { |c| c.update publish_contributor: false }
    end
  end

  def expire_published_contributor_cache
    self.own_contributions.each do |contribution|
      if contribution.publish_contributor? && contribution.story.present?
        contribution.story.expire_published_contributor_cache(self.id)
      end
    end
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

end
