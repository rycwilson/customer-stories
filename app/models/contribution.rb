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

  #
  # this method extracts the necessary combination of contribution
  # and contributor data for new contribution AJAX response
  #
  def self.pre_request success_id
    Contribution.where(success_id: success_id, status: 'pre_request')
                .order(created_at: :desc)
                .map do |contribution|
                  {
                    contribution_id: contribution.id,
                    full_name: contribution.user.full_name,
                    email: contribution.user.email,
                    role: contribution.role,
                  }
                end
  end

  #
  # return in-progress Contributions for a given Success
  # sort oldest to newest
  #
  def self.in_progress success_id
    order = ['did_not_respond', 'remind2', 'remind1', 'request']
    Contribution.where(success_id: success_id)
                .select { |c| c.status == 'request' or
                              c.status == 'remind1' or
                              c.status == 'remind2' or
                              c.status == 'did_not_respond' }
                .sort do |a,b|
                  if order.index(a.status) < order.index(b.status)
                    -1
                  elsif order.index(a.status) > order.index(b.status)
                    1
                  else 0
                  end
                end
  end

end
