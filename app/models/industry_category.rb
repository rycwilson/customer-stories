class IndustryCategory < ActiveRecord::Base

  belongs_to :company

  has_many :industries_successes
  has_many :successes, through: :industries_successes

end
