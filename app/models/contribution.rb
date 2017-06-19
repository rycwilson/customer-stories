class Contribution < ActiveRecord::Base

  belongs_to :contributor, class_name: 'User', foreign_key: 'user_id'
  belongs_to :referrer, class_name: 'User', foreign_key: 'referrer_id'
  belongs_to :success
  has_one :customer, through: :success
  has_one :company, through: :success
  has_one :story, through: :success
  has_one :email_contribution_request, dependent: :destroy

  scope :story_all, ->(story_id) {
    joins(success: { story: {} })
    .where(stories: { id: story_id })
  }
  scope :story_all_except_curator, ->(story_id, curator_id) {
    story_all(story_id)
    .where.not(user_id: curator_id)
  }

  scope :company, ->(company_id) {
    includes(:contributor, success: { story: {}, customer: {} })
    .joins(success: { customer: {} })
    .where(customers: { company_id: company_id })
  }
  scope :company_submissions_since, ->(company_id, days_ago) {
    company(company_id).where('submitted_at >= ?', days_ago.days.ago)
  }
  scope :company_requests_received_since, ->(company_id, days_ago) {
    company(company_id).where('request_received_at >= ?', days_ago.days.ago)
  }

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

  after_commit :expire_published_contributor_cache, on: :update, if:
        Proc.new { |contribution|
          contribution.previous_changes.key?('publish_contributor')
        }

  # when selecting or de-selecting a preview contributor,
  # expire the story tile and index as a whole
  after_commit on: :update do
    self.company.expire_all_stories_cache(true)
    self.story.expire_story_tile_fragment_cache
    self.company.increment_curator_stories_index_fragments_memcache_iterator
    self.company.increment_public_stories_index_fragments_memcache_iterator
  end if Proc.new { |contribution|
           ( story.previous_changes.keys & ['preview_contributor'] ).any?
         }

  def display_status
    case self.status
      when 'pre_request'
        return "added #{self.created_at.strftime('%-m/%-d/%y')}"
      when 'request'
        return "request sent #{(self.remind_at - self.remind_1_wait.days).strftime('%-m/%-d/%y')} (email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'remind1'
        return "first reminder sent #{(self.remind_at - self.remind_2_wait.days).strftime('%-m/%-d/%y')} (email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'remind2'
        return "second reminder sent #{(self.remind_at - self.remind_2_wait.days).strftime('%-m/%-d/%y')} (email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'did_not_respond'
        return "follow up (email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'contribution'
        return 'contribution submitted'
      when 'feedback'
        return 'review feedback'
      when 'unsubscribe'
        return "unsubscribed from story"
      when 'opt_out'
        return "opted out of all emails"
      when 're_send'
        # hack: remind_at holds the re-send date
        return "request re-sent #{self.remind_at.strftime('%-m/%-d/%y')}"
    end
  end

  def table_status
    case self.status
      when 'pre_request'
        return "Ready for request"
      when 'request'
        return "Request Sent"
      when 'remind1'
        return "Second request sent"
      when 'remind2'
        return "Third request sent"
      when 'did_not_respond'
        return "No response"
      when 'contribution'
        return 'Contribution submitted'
      when 'feedback'
        return 'Feedback submitted'
      when 'unsubscribe'
        return "Contribution submitted"
      when 'opt_out'
        return "Opted out"
      when 're_send'
        return "Final request sent"
    end
  end


  def self.send_reminders
    # logs to log/cron.log in development environment (output set in schedule.rb)
    # TODO: log in production environment
    # logger.info "sending reminders - #{Time.now.strftime('%-m/%-d/%y at %I:%M %P')}"
    Contribution.where("status IN ('request', 'remind1', 'remind2', 're_send')")
                .each do |contribution|
      # puts "processing contribution #{contribution.id} with status #{contribution.status}"
      if contribution.remind_at.past?
        unless ['remind2', 're_send'].include? contribution.status
          UserMailer.send_contribution_reminder(contribution).deliver_now
        end
        if contribution.status == 'request'
          new_status = 'remind1'
          new_remind_at = Time.now + contribution.remind_2_wait.days
        elsif contribution.status == 'remind1'
          new_status = 'remind2'
          # no more reminders, but need to trigger when to change status to 'did_not_respond'
          new_remind_at = Time.now + contribution.remind_2_wait.days
        elsif contribution.status == 're_send'
          # for re_send, remind_at captures when it was re-sent
          if contribution.remind_at < contribution.remind_2_wait.days.ago
            new_status = 'did_not_respond'
            new_remind_at = nil
          end
        else
          new_status = 'did_not_respond'
          new_remind_at = nil
        end
        contribution.update(status: new_status, remind_at: new_remind_at)
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

  # returns a hash with subject and body, all placeholders populated with data
  def generate_request_email
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

  def expire_published_contributor_cache
    story = self.success.story
    story.expire_published_contributor_cache(self.contributor.id)
  end

end
