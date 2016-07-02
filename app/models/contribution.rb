class Contribution < ActiveRecord::Base

  belongs_to :contributor, class_name: 'User', foreign_key: 'user_id'
  belongs_to :referrer, class_name: 'User', foreign_key: 'referrer_id'
  belongs_to :success
  has_one :email_contribution_request, dependent: :destroy

  validates :role, presence: true
  validates :contribution, presence: true,
                if: Proc.new { |contribution| contribution.status == 'contribution'}
  validates :feedback, presence: true,
                if: Proc.new { |contribution| contribution.status == 'feedback'}

  # contributor may have only one contribution per story
  validates_uniqueness_of :user_id, scope: :success_id

  # represents number of days between reminder emails
  validates :remind_1_wait, numericality: { only_integer: true }
  validates :remind_2_wait, numericality: { only_integer: true }

  def status_helper
    case self[:status]
    when 'pre_request'
      return "added #{self.created_at.strftime('%-m/%-d/%y')}"
    when 'request'
      return "request sent #{(self.remind_at - self.remind_1_wait.days).strftime('%-m/%-d/%y')}"
    when 'remind1'
      return "first reminder sent #{(self.remind_at - self.remind_2_wait.days).strftime('%-m/%-d/%y')}"
    when 'remind2'
      return "second reminder sent #{(self.remind_at - self.remind_2_wait.days).strftime('%-m/%-d/%y')}"
    when 'did_not_respond'
      return "follow up phone call"
    when 'contribution'
      return 'contribution submitted'
    when 'feedback'
      return 'review feedback'
    when 'unsubscribe'
      return "unsubscribed from story"
    when 'opt_out'
      return "opted out of all emails"
    end
  end

  def self.send_reminders
    # logs to log/cron.log in development environment (output set in schedule.rb)
    # TODO: log in production environment
    # logger.info "sending reminders - #{Time.now.strftime('%-m/%-d/%y at %I:%M %P')}"
    Contribution.where("status IN ('request', 'remind1', 'remind2')")
                .each do |contribution|
      # puts "processing contribution #{contribution.id} with status #{contribution.status}"
      if contribution.remind_at.past?
        unless contribution.status == 'remind2'
          UserMailer.send_contribution_reminder(contribution).deliver_now
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
                .where("success_id = ? AND status NOT IN ('unsubscribe', 'opt_out')", success_id)
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

  # returns a hash with subject and body, all placeholders populated with data
  def generate_request_email
    logger.debug "CURATOR: #{self.success.curator.full_name}"
    success = self.success
    curator = success.curator
    template = curator.company.email_templates
                              .where(name: self.role.capitalize).take
    subject = template.subject
                      .sub("[customer_name]", success.customer.name)
                      .sub("[company_name]", curator.company.name)
                      .sub("[product_name]", success.products.take.try(:name) || "")
    host = "http://#{curator.company.subdomain}.#{ENV['HOST_NAME']}"
    referral_intro = self.referrer_id.present? ?
                     self.referrer.full_name + " referred me to you. " : ""
    body = template.body
                    .gsub("[customer_name]", success.customer.name)
                    .gsub("[company_name]", curator.company.name)
                    .gsub("[product_name]", success.products.take.try(:name) || "")
                    .gsub("[contributor_first_name]", self.contributor.first_name)
                    .gsub("[contributor_last_name]", self.contributor.last_name)
                    .gsub("[curator_first_name]", curator.first_name)
                    .gsub("[referral_intro]", referral_intro)
                    .gsub("[curator_full_name]", curator.full_name)
                    .gsub("[curator_email]", curator.email)
                    .gsub("[curator_phone]", curator.phone || "")
                    .gsub("[curator_title]", curator.title || "")
                    .gsub("[curator_img_url]", curator.photo_url || "")
                    .gsub("[contribution_url]", "#{host}/contributions/#{self.access_token}/contribution")
                    .gsub("[feedback_url]", "#{host}/contributions/#{self.access_token}/feedback")
                    .gsub("[unsubscribe_url]", "#{host}/contributions/#{self.access_token}/unsubscribe")
                    .gsub("[opt_out_url]", "#{host}/contributions/#{self.access_token}/opt_out")
                    .html_safe
    { subject: subject, body: body }
  end

end
