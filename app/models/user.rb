# TODO: check validations - client and server side
# use Bootstrap Validator on client side if necessary
class User < ActiveRecord::Base

  # RYAN = self.find_by(email:'***REMOVED***')

  belongs_to :company
  validates :first_name, presence: true
  validates :last_name, presence: true

  # a User can have his own contribution(s) (i.e. he is contributor),
  # or he can be the Referrer for contribution(s)
  has_many :own_contributions, class_name: 'Contribution', foreign_key: 'user_id'
  has_many :referred_contributions, class_name: 'Contribution', foreign_key: 'referrer_id'

  has_many :successes, class_name: 'Success', foreign_key: 'curator_id' # curator, no (dependent: :destroy)

  # for changing password
  attr_accessor :current_password

  # Adding signup code for beta control
  attr_accessor :sign_up_code
  validates :sign_up_code,
    on: :create,
    presence: true,
    inclusion: { in: ["csp_beta"] }

  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :lockable#, :confirmable

  def full_name
    self.first_name + " " + self.last_name
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
