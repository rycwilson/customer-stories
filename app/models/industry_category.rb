class IndustryCategory < ActiveRecord::Base

  belongs_to :company

  has_many :industries_successes, dependent: :destroy
  has_many :successes, through: :industries_successes

end
