class Contribution < ActiveRecord::Base

  # the default_scope introduces difficulty to, e.g., this:
  # has_many :contributors, -> { distinct }, through: :contributions, source: :contributor
  # => #<ActiveRecord::StatementInvalid: PG::InvalidColumnReference: ERROR:  for SELECT DISTINCT, ORDER BY expressions must appear in select list
  # default_scope { order(created_at: :desc) }
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
  scope :story_all, ->(story_id) {
    joins(success: { story: {} })
    .where(stories: { id: story_id })
  }
  scope :story_all_except_curator, ->(story_id, curator_id) {
    story_all(story_id)
    .where.not(user_id: curator_id)
  }

  # associations
  belongs_to :success, inverse_of: :contributions
  belongs_to :contributor, class_name: 'User', foreign_key: 'user_id'
  belongs_to :referrer, class_name: 'User', foreign_key: 'referrer_id'
  has_one :customer, through: :success
  has_one :company, through: :success
  has_one :curator, through: :success
  has_one :story, through: :success
  has_one :email_contribution_request, dependent: :destroy
  belongs_to :crowdsourcing_template
  has_many :contributor_questions, through: :crowdsourcing_template

  accepts_nested_attributes_for(:success, allow_destroy: false)
  accepts_nested_attributes_for(:contributor, allow_destroy: false)
  accepts_nested_attributes_for(:referrer, allow_destroy: false)

  before_create(:generate_access_token)

  # when creating a new success with referrer, a contribution is created
  # with referrer_id == user_id (i.e. contributor and referrer are same)
  before_create(:set_user_id_for_new_success_referrer, if: Proc.new do
      # use a success virtual attribute so we can see from here if it's a new record
      # also note that the inverse_of setting is necessary for the success -> contributions relationship
      # (so self and self.success are related to each other in memory)
      self.success.is_new_record? &&
      self.referrer_id.present? &&
      self.user_id.nil?
    end
  )
  before_update(:set_request_sent_at, if: Proc.new do
      self.status_changed? && (self.status == 'request_sent' || self.status == 'request_re_sent')
    end
  )
  before_update(:set_request_remind_at, if: Proc.new do
      self.status_changed? &&
      ['request_sent', 'first_reminder_sent', 'second_reminder_sent'].include?(self.status)
    end
  )
  before_update(:set_submitted_at, :send_alert, if: Proc.new do
      self.status_changed? &&
      ['contribution_submitted', 'feedback_submitted'].include?(self.status)
    end
  )

  # validates :user_id, presence: true
  # validates :success_id, presence: true
  # validates :role, presence: true
  # validates :contribution, presence: true,
  #               if: Proc.new { |contribution| contribution.status == 'contribution'}
  # validates :feedback, presence: true,
  #               if: Proc.new { |contribution| contribution.status == 'feedback'}

  # contributor may have only one contribution per story
  validates_uniqueness_of(:user_id, scope: :success_id)

  # represents number of days between reminder emails
  validates :first_reminder_wait, numericality: { only_integer: true }
  validates :second_reminder_wait, numericality: { only_integer: true }

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
        return "waiting for invitation\n(added #{self.created_at.strftime('%-m/%-d/%y')})"
      when 'request_sent'
        return "request sent #{(self.request_sent_at).strftime('%-m/%-d/%y')}\n(email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'first_reminder_sent'
        return "reminder sent #{(self.request_sent_at + self.first_reminder_wait.days).strftime('%-m/%-d/%y')}\n(email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'second_reminder_sent'
        return "reminder sent #{(self.request_sent_at + self.second_reminder_wait.days).strftime('%-m/%-d/%y')}\n(email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'did_not_respond'
        return "did not respond\n(email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'contribution_submitted'
        return '<span><a href="#contribution-content-modal" data-toggle="modal">Contribution</a> submitted</span>'.html_safe
      when 'feedback_submitted'
        return '<span><a href="#contribution-content-modal" data-toggle="modal">Feedback</a> submitted</span>'.html_safe
      when 'contribution_completed'
        return '<span><a href="#contribution-content-modal" data-toggle="modal">Contribution</a> completed<i class="fa fa-check pull-right"></i></span>'.html_safe
      when 'feedback_completed'
        return '<span><a href="#contribution-content-modal" data-toggle="modal">Feedback</a> completed<i class="fa fa-check pull-right"></i></span>'.html_safe
      when 'unsubscribed'
        return "unsubscribed&nbsp;&nbsp;<i data-toggle='tooltip' data-placement='top' title='Contributor has unsubscribed from emails related to this Customer Win/Story' style='font-size:16px;color:#666' class='fa fa-question-circle-o'></i>".html_safe
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
    Contribution.where("status IN ('request_sent', 'first_reminder_sent', 'second_reminder_sent', 'request_re_sent')")
                .each do |contribution|
      if contribution.remind_at.try(:past?)
        UserMailer.contribution_reminder(contribution).deliver_now
        if contribution.status == 'request_sent'
          new_status = 'first_reminder_sent'
        elsif contribution.status == 'first_reminder_sent'
          new_status = 'second_reminder_sent'
        end
      elsif
        ( contribution.status == 'second_reminder_sent' &&
          Time.now > contribution.request_sent_at + contribution.first_reminder_wait.days +
          (2 * contribution.second_reminder_wait.days) ) ||
        ( contribution.status == 'request_re_sent' &&
          Time.now > contribution.request_sent_at + contribution.second_reminder_wait.days )
        new_status = 'did_not_respond'
      end
      contribution.update(status: new_status)
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
      .gsub('[contribution_submission_url]', contribution_request_link('contribution'))
      .gsub('[feedback_submission_url]', contribution_request_link('feedback'))
      .gsub('[unsubscribe_url]', contribution_request_link('unsubscribe'))
      .gsub('[opt_out_url]', contribution_request_link('opt_out'))
      .html_safe
  end

  protected

  def generate_access_token
    self.access_token = SecureRandom.urlsafe_base64
    # recursive call to ensure uniqueness
    generate_access_token if Contribution.exists?(access_token: self.access_token)
  end

  # this works because the route in question is aliased to 'edit_contribution'
  def contribution_request_link (type)
    if ['contribution', 'feedback'].include?(type)
      Rails.application.routes.url_helpers.url_for({
        subdomain: self.company.subdomain,
        controller: 'contributions', action: 'edit',
        token: self.access_token, type: type
      })
    else  # unsubscribe, opt_out
      Rails.application.routes.url_helpers.url_for({
        subdomain: self.company.subdomain,
        controller: 'contributions', action: 'update',
        token: self.access_token, unsubscribe: type == 'unsubscribe',
        opt_out: type == 'opt_out'
      })
    end
  end

  def set_request_sent_at
    self.request_sent_at = Time.now;
  end

  def set_request_remind_at
    if self.status == 'request_sent'
      self.request_remind_at = Time.now + self.first_reminder_wait.days
    elsif self.status == 'first_reminder_sent'
      self.request_remind_at = Time.now + self.second_reminder_wait.days
    elsif self.status == 'second_reminder_sent'
      self.request_remind_at = nil
    end
  end

  def set_submitted_at
    self.submitted_at = Time.now;
  end

  def send_alert
    UserMailer.contribution_alert(self).deliver_now
  end

  def match_user_id_for_new_success_referrer
    self.user_id = self.referrer_id
  end

end
