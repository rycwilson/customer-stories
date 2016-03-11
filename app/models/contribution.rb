class Contribution < ActiveRecord::Base

  belongs_to :contributor, class_name: 'User', foreign_key: 'user_id'
  belongs_to :referrer, class_name: 'User', foreign_key: 'referrer_id'
  belongs_to :success

  validates :contribution, presence: true,
                if: Proc.new { |contribution| contribution.status == 'contribution'}
  validates :feedback, presence: true,
                if: Proc.new { |contribution| contribution.status == 'feedback'}

  # contributor may have only one contribution per story
  validates_uniqueness_of :user_id, scope: :success_id

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
        unless ['remind2', 'unsubscribe', 'opt_out'].include? contribution.status
          UserMailer.contribution_reminder(contribution).deliver_now
        end
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
    order = ['opt_out', 'unsubscribe', 'did_not_respond', 'remind2', 'remind1', 'request']
    Contribution.where(success_id: success_id)
                .select { |c| c.status == 'request' ||
                              c.status == 'remind1' ||
                              c.status == 'remind2' ||
                              c.status == 'did_not_respond' ||
                              c.status == 'unsubscribe' ||
                              c.status == 'opt_out' }
                .sort do |a,b|
                  if order.index(a.status) < order.index(b.status)
                    -1
                  elsif order.index(a.status) > order.index(b.status)
                    1
                  else 0
                  end
                end
  end

  #
  # "Fetch all Contributions where the Contributor has this email and update them"
  # note: need to use the actual table name (users) instead of the alias (contributors)
  #
  def self.update_opt_out_status opt_out_email
    Contribution.joins(:contributor)
                .where(users: { email: opt_out_email })
                .each { |c| c.update status: 'opt_out' }
  end

end
