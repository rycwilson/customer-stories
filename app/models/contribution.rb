class Contribution < ActiveRecord::Base

  belongs_to :user
  belongs_to :success

  def send_reminders
  end

end
