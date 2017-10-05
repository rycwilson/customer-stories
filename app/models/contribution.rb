class Contribution < ActiveRecord::Base

  belongs_to :contributor, class_name: 'User', foreign_key: 'user_id'
  belongs_to :referrer, class_name: 'User', foreign_key: 'referrer_id'
  belongs_to :success
  belongs_to :email_template
  has_one :customer, through: :success
  has_one :company, through: :success
  has_one :curator, through: :success
  has_one :story, through: :success
  has_one :email_contribution_request, dependent: :destroy
  belongs_to :crowdsourcing_template

  accepts_nested_attributes_for(:contributor, allow_destroy: false)

  default_scope { order(created_at: :desc) }

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

  before_create(:generate_access_token)
  before_create(:copy_crowdsourcing_template, if: Proc.new do
      self.crowdsourcing_template_id.present?
    end)
  before_update(:copy_crowdsourcing_template, if: Proc.new do
      self.crowdsourcing_template_id.present? && self.crowdsourcing_template_id_changed?
    end)

  # validates :user_id, presence: true
  # validates :success_id, presence: true
  # validates :role, presence: true
  # validates :contribution, presence: true,
  #               if: Proc.new { |contribution| contribution.status == 'contribution'}
  # validates :feedback, presence: true,
  #               if: Proc.new { |contribution| contribution.status == 'feedback'}

  # contributor may have only one contribution per story
  validates_uniqueness_of :user_id, scope: :success_id

  # represents number of days between reminder emails
  validates :remind_1_wait, numericality: { only_integer: true }
  validates :remind_2_wait, numericality: { only_integer: true }

  after_commit(on: [:update]) do
    # if (self.previous_changes.keys &
    #     ['status', 'contribution', 'feedback', 'notes', 'request_received_at',
    #      'complete', 'publish_contributor', 'preview_contributor']).any?
    # end
    if self.previous_changes.key?('publish_contributor')
      expire_published_contributor_cache
    end

    if self.previous_changes.key?('preview_contributor')
      # when selecting or de-selecting a preview contributor,
      # expire the story tile and index as a whole
      self.company.expire_all_stories_cache(true)
      self.story.expire_story_tile_fragment_cache
      self.company.increment_stories_index_fragments_memcache_iterator
    end
  end

  def display_status
    case self.status
      when 'pre_request'
        return "awaiting request\n(added #{self.created_at.strftime('%-m/%-d/%y')})"
      when 'request_sent'
        return "request sent\n#{(self.remind_at - self.remind_1_wait.days).strftime('%-m/%-d/%y')} (email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'first_reminder_sent'
        return "first reminder sent\n#{(self.remind_at - self.remind_2_wait.days).strftime('%-m/%-d/%y')} (email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'second_reminder_sent'
        return "second reminder sent\n#{(self.remind_at - self.remind_2_wait.days).strftime('%-m/%-d/%y')} (email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'did_not_respond'
        return "did not respond\n(email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'contribution_submitted'
        return 'contribution submitted'
      when 'feedback_submitted'
        return 'feedback submitted'
      when 'unsubscribed'
        return "unsubscribed&nbsp;&nbsp;<i data-toggle='tooltip' data-placement='top' title='Contributor has unsubscribed from emails related to this Story Candidate / Story' style='font-size:16px;color:#666' class='fa fa-question-circle-o'></i>".html_safe
      when 'opted_out'
        return "opted out&nbsp;&nbsp;<i data-toggle='tooltip' data-placement='top' title='Contributor has opted out of all Customer Stories emails' style='font-size:16px;color:#666' class='fa fa-question-circle-o'></i>".html_safe
      when 'request_re_sent'
        # hack: remind_at holds the re-send date
        return "request re-sent #{self.remind_at.strftime('%-m/%-d/%y')}"
    end
  end

  def self.send_reminders
    # logs to log/cron.log in development environment (output set in schedule.rb)
    # TODO: log in production environment
    # logger.info "sending reminders - #{Time.now.strftime('%-m/%-d/%y at %I:%M %P')}"
    Contribution.where("status IN ('request', 'first_reminder_sent', 'second_reminder_sent', 're_sent')")
                .each do |contribution|
      # puts "processing contribution #{contribution.id} with status #{contribution.status}"
      if contribution.remind_at.past?
        unless ['second_reminder_sent', 're_sent'].include? contribution.status
          UserMailer.send_contribution_reminder(contribution).deliver_now
        end
        if contribution.status == 'request_sent'
          new_status = 'first_reminder_sent'
          new_remind_at = Time.now + contribution.remind_2_wait.days
        elsif contribution.status == 'first_reminder_sent'
          new_status = 'second_reminder_sent'
          # no more reminders, but need to trigger when to change status to 'did_not_respond'
          new_remind_at = Time.now + contribution.remind_2_wait.days
        elsif contribution.status == 're_sent'
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

  def generate_request_email
    # replaced by copy_crowdsourcing_template
  end

  def expire_published_contributor_cache
    story = self.success.story
    story.expire_published_contributor_cache(self.contributor.id)
  end

  def copy_crowdsourcing_template
    referral_intro = self.referrer_id.present? ?
                     self.referrer.full_name + " referred me to you." : ""
    self.request_subject = self.crowdsourcing_template.request_subject
      .sub('[customer_name]', self.customer.name)
      .sub('[company_name]', self.company.name)
      .sub('[contributor_first_name', self.contributor.first_name)
      .sub('[contributor_full_name', self.contributor.full_name)
    self.request_body = self.crowdsourcing_template.request_body
      .gsub('[customer_name]', self.customer.name)
      .gsub('[company_name]', self.company.name)
      .gsub('[contributor_first_name]', self.contributor.first_name)
      .gsub('[contributor_last_name]', self.contributor.last_name)
      .gsub('[referral_intro]', referral_intro)
      .gsub('[curator_full_name]', self.curator.full_name)
      .gsub('[curator_email]', self.curator.email)
      .gsub('[curator_phone]', self.curator.phone || '')
      .gsub('[curator_position]', self.curator.title || '')
      .gsub('[curator_img_url]', self.curator.photo_url || '')
      .gsub('[contribution_url]', contribution_submission_url('contribution'))
      .gsub('[feedback_url]', contribution_submission_url('feedback'))
      .gsub('[unsubscribe_url]', contribution_submission_url('unsubscribe'))
      .gsub('[opt_out_url]', contribution_submission_url('opt_out'))
      .html_safe
  end

  protected

  def generate_access_token
    self.access_token = SecureRandom.urlsafe_base64
    # recursive call to ensure uniqueness
    generate_access_token if Contribution.exists?(access_token: self.access_token)
  end

  # this works because the route in question is aliased to 'edit_contribution'
  def contribution_submission_url (type)
    return Rails.application.routes.url_helpers.url_for(
      subdomain: self.company.subdomain,
      controller: 'contributions', action: 'edit',
      token: self.access_token, type: type
    )
  end

end
