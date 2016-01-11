class Contribution < ActiveRecord::Base

  belongs_to :user  # contributor
  belongs_to :success

  # represents number of days between reminder emails
  validates :remind_1_wait, numericality: { only_integer: true }
  validates :remind_2_wait, numericality: { only_integer: true }

  def self.send_reminders
    # logs to log/cron.log in development environment (output set in schedule.rb)
    # TODO: log in production environment
    puts "sending reminders - #{Time.now.strftime('%-m/%-d/%y at %I:%M %P')}"
    Contribution.where("status IN ('request', 'remind1')")
                .each do |contribution|
      puts "processing contribution #{contribution.id} with status #{contribution.status}"
      if contribution.remind_at.past?
        UserMailer.contribution_reminder(contribution).deliver_now
        if contribution.status == 'request'
          new_status = 'remind1'
          new_remind_at = Time.now + contribution.remind_2_wait.days
        else
          new_status = 'remind2'
          new_remind_at = nil  # no more reminders
        end
        contribution.update(status: new_status, remind_at: new_remind_at)
        puts "email reminder sent, new remind_at: #{contribution.remind_at.strftime('%-m/%-d/%y at %I:%M %P')}"
      end
      puts "status for #{contribution.id} is now #{contribution.status}"
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
  # sort oldest to newest (according to status)
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
