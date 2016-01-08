class Contribution < ActiveRecord::Base

  belongs_to :user
  belongs_to :success

  # represents number of days between reminder emails
  validates :reminder_frequency, numericality: { only_integer: true }

end
