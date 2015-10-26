# TODO: check validations - client and server side
# use Bootstrap Validator on client side if necessary
class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  #  removed  :confirmable, so it works on heroku until we have email service set up
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
       :confirmable, :lockable

  belongs_to :company
end
