
class User < ApplicationRecord
  belongs_to :company, optional: true
  validates :first_name, :email, presence: true
  validates :phone, format: { without: /_/ }
  # validate correct format OR empty string

  has_many :own_contributions, class_name: 'Contribution', foreign_key: 'contributor_id', dependent: :destroy
  has_many :referred_contributions, class_name: 'Contribution', foreign_key: 'referrer_id'

  has_many :successes, class_name: 'Success', foreign_key: 'curator_id'
  has_many :stories, through: :successes

  scope :imitable, -> { where(imitable: true) }

  after_update_commit do 
    photo_was_updated = previous_changes.keys.include?('photo_url') && previous_changes[:photo_url].first.present?
    if photo_was_updated
      S3Util.delete_object(S3_BUCKET, previous_changes[:photo_url].first)
    end
  end
  
  # for seeds
  attr_accessor :role

  # Adding signup code for beta control
  attr_accessor :sign_up_code
  validates(:sign_up_code, on: :create, presence: { message: "can't be blank" }, inclusion: { in: ['csp_beta'], message: 'is invalid' })

  attr_accessor :skip_callbacks

  devise :database_authenticatable, :registerable, :recoverable, :rememberable, :trackable, :validatable, :confirmable
  # :lockable, :timeoutable, :omniauthable
  
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

  # This is for users signing up via Oauth
  # Not presently using this, but may in the future
  # def self.create_from_omniauth auth
  #   create! do |user|
  #     user.provider = auth["provider"]
  #     user.uid = auth["uid"]
  #     # user.name = auth["info"]["nickname"]
  #   end
  # end

  def curator_name_with_stories_count
    return '' unless self.company 
    "#{self.full_name} (#{self.stories.count})"
  end
end
