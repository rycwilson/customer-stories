class Contribution < ActiveRecord::Base

  belongs_to :user  # contributor
  belongs_to :success

  # represents number of days between reminder emails
  validates :remind_1_wait, numericality: { only_integer: true }
  validates :remind_2_wait, numericality: { only_integer: true }

  def send_reminder
    if self.remind_at.past?
      UserMailer.contribution_reminder(self).deliver_now
      if self.status == 'request'
        new_status = 'remind1'
        new_remind_at = Time.now + self.remind_2_wait.days
      else
        new_status = 'remind2'
        new_remind_at = nil  # no more reminders
      end
      self.update(status: new_status, remind_at: new_remind_at)
    end
  end

end
