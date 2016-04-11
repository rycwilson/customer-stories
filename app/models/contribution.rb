class Contribution < ActiveRecord::Base

  belongs_to :contributor, class_name: 'User', foreign_key: 'user_id'
  belongs_to :referrer, class_name: 'User', foreign_key: 'referrer_id'
  belongs_to :success
  has_one :email_contribution_request, dependent: :destroy

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
    # logger.info "sending reminders - #{Time.now.strftime('%-m/%-d/%y at %I:%M %P')}"
    Contribution.where("status IN ('request', 'remind1', 'remind2')")
                .each do |contribution|
      # puts "processing contribution #{contribution.id} with status #{contribution.status}"
      if contribution.remind_at.past?
        unless contribution.status == 'remind2'
          UserMailer.contribution_reminder(contribution).deliver_now
        end
        if contribution.status == 'request'
          new_status = 'remind1'
          new_remind_at = Time.now + contribution.remind_2_wait.days
          # puts "first reminder sent, new remind_at: #{new_remind_at.strftime('%-m/%-d/%y at %I:%M %P')} UTC"
        elsif contribution.status == 'remind1'
          new_status = 'remind2'
          # no more reminders, but need to trigger when to change status to 'did_not_respond'
          new_remind_at = Time.now + contribution.remind_2_wait.days
          # puts "second reminder sent, new remind_at (status to did_not_respond): #{new_remind_at.strftime('%-m/%-d/%y at %I:%M %P')} UTC"
        else
          new_status = 'did_not_respond'
          new_remind_at = nil
          # puts "no more reminders, did not respond"
        end
        contribution.update(status: new_status, remind_at: new_remind_at)
      end
      # puts "status for #{contribution.id} is now #{contribution.status}"
    end
  end

  def self.pre_request success_id
    Contribution.includes(:contributor, :referrer)
                .where("success_id = ? AND status = ?", success_id, "pre_request")
                .order(created_at: :desc)  # most recent first
  end

  #
  # return in-progress Contributions for a given Success
  # sort oldest to newest (according to status)
  #
  def self.in_progress success_id
    status_options = ['opt_out', 'unsubscribe', 'remind2', 'remind1', 'request']
    Contribution.includes(:contributor, :referrer)
                .where("success_id = ? AND status IN (?)", success_id, status_options)
                .sort do |a,b|  # sorts as per order of status_options
                  if status_options.index(a.status) < status_options.index(b.status)
                    -1
                  elsif status_options.index(a.status) > status_options.index(b.status)
                    1
                  else 0
                  end
                end
  end

  def self.next_steps success_id
    status_options = ['feedback', 'did_not_respond']
    Contribution.includes(:contributor, :referrer)
                .where("success_id = ? AND status IN (?)", success_id, status_options)
  end

  def self.contributors success_id
    Contribution.includes(:contributor, :referrer)
                .where("success_id = ? AND status = ?", success_id, 'contribution')
  end

  def self.connections success_id
    Contribution.includes(:contributor, :referrer)
                .where("success_id = ? AND (status = ? OR (notes IS NOT NULL AND notes != ?))",
                          success_id, "contribution", "")
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
