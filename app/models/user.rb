# TODO: check validations - client and server side
# use Bootstrap Validator on client side if necessary
class User < ActiveRecord::Base

  # Adding signup code for beta control
  attr_accessor :sign_up_code
  validates :sign_up_code,
    on: :create,
    presence: true,
    inclusion: { in: ["csp_beta"] }

  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  #  removed  :confirmable, so it works on heroku until we have email service set up
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :lockable, :confirmable


  belongs_to :company
end
