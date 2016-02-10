class Contribution < ActiveRecord::Base

  belongs_to :contributor, class_name: 'User', foreign_key: 'user_id'
  belongs_to :referrer, class_name: 'User', foreign_key: 'referrer_id'

  belongs_to :success

  # represents number of days between reminder emails
  validates :remind_1_wait, numericality: { only_integer: true }
  validates :remind_2_wait, numericality: { only_integer: true }

  def self.send_reminders
    # logs to log/cron.log in development environment (output set in schedule.rb)
    # TODO: log in production environment
    puts "sending reminders - #{Time.now.strftime('%-m/%-d/%y at %I:%M %P')}"
    Contribution.where("status IN ('request', 'remind1', 'remind2')")
                .each do |contribution|
      puts "processing contribution #{contribution.id} with status #{contribution.status}"
      if contribution.remind_at.past?
        UserMailer.contribution_reminder(contribution).deliver_now unless contribution.status == 'remind2'
        if contribution.status == 'request'
          new_status = 'remind1'
          new_remind_at = Time.now + contribution.remind_2_wait.days
          puts "first reminder sent, new remind_at: #{new_remind_at.strftime('%-m/%-d/%y at %I:%M %P')} UTC"
        elsif contribution.status == 'remind1'
          new_status = 'remind2'
          new_remind_at = Time.now + contribution.remind_2_wait.days  # no more reminders
          puts "second reminder sent, new remind_at (status to did_not_respond): #{new_remind_at.strftime('%-m/%-d/%y at %I:%M %P')} UTC"
        else
          new_status = 'did_not_respond'
          new_remind_at = nil
          puts "no more reminders, did not respond"
        end
        contribution.update(status: new_status, remind_at: new_remind_at)
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
              full_name: contribution.contributor.full_name,
              email: contribution.contributor.email,
              role: contribution.role,
              # this doesn't work, "No Method" error
              # -> but works in console, wtf?
              # referrer: contribution.referrer.try[:full_name]
              referrer: contribution.referrer ? contribution.referrer.full_name : ""
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
