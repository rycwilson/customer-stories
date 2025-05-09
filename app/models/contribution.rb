class Contribution < ApplicationRecord

  # the default_scope introduces difficulty to, e.g., this:
  # has_many :contributors, -> { distinct }, through: :contributions, source: :contributor
  # => #<ActiveRecord::StatementInvalid: PG::InvalidColumnReference: ERROR:  for SELECT DISTINCT, ORDER BY expressions must appear in select list
  # default_scope { order(created_at: :desc) }
  scope :company, -> (company_id) {
    includes(:contributor, success: { story: {}, customer: {} })
    .joins(success: { customer: {} })
    .where(customers: { company_id: company_id })
  }
  scope :company_submissions_since, ->( company_id, days_ago) {
    company(company_id).where('submitted_at >= ?', days_ago.days.ago)
  }
  scope :company_requests_received_since, -> (company_id, days_ago) {
    company(company_id).where('request_received_at >= ?', days_ago.days.ago)
  }
  scope :story_all, -> (story_id) {
    joins(success: { story: {} })
    .where(stories: { id: story_id })
  }

  # associations
  belongs_to :success, inverse_of: :contributions
  belongs_to :contributor, class_name: 'User', foreign_key: 'contributor_id'

  # this is a handy way to select a limited set of attributes
  belongs_to(
    :win_story_contributor, 
    -> { select('users.id, users.first_name, users.last_name, users.email, users.linkedin_url') }, 
    class_name: 'User', 
    foreign_key: 'contributor_id',
    optional: true
  )
  belongs_to :referrer, class_name: 'User', foreign_key: 'referrer_id', optional: true
  has_one :customer, through: :success
  has_one :company, through: :success
  has_one :curator, through: :success
  has_one :story, through: :success
  belongs_to :invitation_template, optional: true
  has_one :contributor_invitation, dependent: :destroy
  alias_attribute :invitation, :contributor_invitation
  has_many :contributor_questions, through: :invitation_template
  alias_attribute :questions, :contributor_questions
  has_many :contributor_answers, dependent: :destroy do
    def to_question (question_id)
      where(contributor_question_id: question_id)
    end
  end
  alias_attribute :answers, :contributor_answers

  accepts_nested_attributes_for(:success, allow_destroy: false)
  accepts_nested_attributes_for(:referrer, allow_destroy: false, reject_if: :missing_referrer_attributes?)
  # don't need reject_if for the contributor, as the contribution would have been rejected already
  accepts_nested_attributes_for(:contributor, allow_destroy: false)
  accepts_nested_attributes_for(:invitation_template)
  accepts_nested_attributes_for(:contributor_answers)

  before_create(:generate_access_token)

  # # when creating a new success with referrer, a contribution is created
  # # with referrer_id == contributor_id (i.e. contributor and referrer are same)
  before_create(:set_contributor_id_for_new_success_referrer, if: Proc.new do
      # use a success virtual attribute so we can see from here if it's a new record
      # also note that the inverse_of setting is necessary for the success -> contributions relationship
      # (so self and self.success are related to each other in memory)
      self.success.is_new_record? &&
      self.referrer_id.present? &&
      self.contributor_id.blank?
    end
  )
  before_create(:set_referrer_id_for_new_success_contact, if: Proc.new do
      self.success.is_new_record? &&
      self.success.referrer.present?
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


  # validates :contributor_id, presence: true
  # validates :success_id, presence: true
  # validates :role, presence: true
  # validates :contribution, presence: true,
  #               if: Proc.new { |contribution| contribution.status == 'contribution'}
  # validates :feedback, presence: true,
  #               if: Proc.new { |contribution| contribution.status == 'feedback'}

  # contributor may have only one contribution per success
  validates_uniqueness_of(:contributor_id, scope: :success_id)

  # represents number of days between reminder emails
  validates :first_reminder_wait, numericality: { only_integer: true }
  validates :second_reminder_wait, numericality: { only_integer: true }


  def display_status
    case self.status
      when 'pre_request'
        return "waiting for invitation\n(added #{self.created_at.strftime('%-m/%-d/%y')})"
      when 'request_sent'
        return "invitation sent #{(self.request_sent_at).strftime('%-m/%-d/%y')}\n(email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'first_reminder_sent'
        return "reminder sent #{(self.request_sent_at + self.first_reminder_wait.days).strftime('%-m/%-d/%y')}\n(email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'second_reminder_sent'
        return "reminder sent #{(self.request_sent_at + self.second_reminder_wait.days).strftime('%-m/%-d/%y')}\n(email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'did_not_respond'
        return "did not respond\n(email #{self.request_received_at.present? ? '' : 'not' } opened)"
      when 'contribution_submitted'
        return "<span><a href=\"javascript:;\" id=\"show-contribution-#{self.id}\">Contribution</a> submitted</span>".html_safe
      when 'feedback_submitted'
        return "<span><a href=\"javascript:;\" id=\"show-contribution-#{self.id}\">Feedback</a> submitted</span>".html_safe
      when 'contribution_completed'
        return "<span><a href=\"javascript:;\" id=\"show-contribution-#{self.id}\">Contribution</a> completed<i class=\"fa fa-check pull-right\"></i></span>".html_safe
      when 'feedback_completed'
        return "<span><a href=\"javascript:;\" id=\"show-contribution-#{self.id}\">Feedback</a> completed<i class=\"fa fa-check pull-right\"></i></span>".html_safe
      when 'opted_out'
        return "opted out&nbsp;&nbsp;<i data-toggle='tooltip' data-placement='top' title='Contributor has opted out of participating in this Customer Win/Story' style='font-size:16px;color:#666' class='fa fa-question-circle-o'></i>".html_safe
      when 'removed'
        return "removed&nbsp;&nbsp;<i data-toggle='tooltip' data-placement='top' title='Contributor has removed himself from all future invitations' style='font-size:16px;color:#666' class='fa fa-question-circle-o'></i>".html_safe
      when 'request_re_sent'
        return "request re-sent #{self.request_sent_at.strftime('%-m/%-d/%y')}"
    end
  end

  def self.send_reminders
    # logs to log/cron.log in development environment (output set in schedule.rb)
    # TODO: log in production environment
    # logger.info "sending reminders - #{Time.now.strftime('%-m/%-d/%y at %I:%M %P')}"
    Contribution.where("status IN ('request_sent', 'first_reminder_sent', 'second_reminder_sent', 'request_re_sent')")
                .each do |contribution|
      if contribution.request_remind_at.try(:past?)
        UserMailer.contribution_reminder(contribution).deliver_now
        if contribution.status == 'request_sent'
          contribution.update(status: 'first_reminder_sent')
        elsif contribution.status == 'first_reminder_sent'
          contribution.update(status: 'second_reminder_sent')
        else
          # should not be here!
        end
      elsif
          ( contribution.status == 'second_reminder_sent' &&
            Time.now > contribution.request_sent_at + contribution.first_reminder_wait.days +
            (2 * contribution.second_reminder_wait.days) ) ||
          ( contribution.status == 'request_re_sent' &&
            Time.now > contribution.request_sent_at + contribution.second_reminder_wait.days )
        contribution.update(status: 'did_not_respond')
      end
    end
  end

  #
  # "Fetch all Contributions where the Contributor has this email and update them"
  # note: need to use the actual table name (users) instead of the alias (contributors)
  #
  def self.update_opt_out_status (opt_out_email)
    Contribution.joins(:contributor)
                .where(users: { email: opt_out_email })
                .each { |c| c.update status: 'removed' }
  end

  def timestamp
    self.created_at.to_i
  end

  # ref: https://stackoverflow.com/questions/6346134
  def contributor_attributes=(attrs)
    if attrs['id'].present?
      self.contributor = User.find(attrs['id'])
    end
    super
  end

  def referrer_attributes=(attrs)
    if attrs['id'].present?
      self.referrer = User.find(attrs['id'])
    end
    super
  end

  # this works because the route in question is aliased to 'edit_contribution'
  # type is in ['contribution', 'feedback', 'opt_out', 'remove']
  def invitation_link (type)
    Rails.application.routes.url_helpers.url_for({
      subdomain: self.company.subdomain,
      controller: 'contributions',
      action: ['contribution', 'feedback'].include?(type) ? 'edit' : 'update',
      token: self.access_token, type: type
    })
  end

  def path
    Rails.application.routes.url_helpers.contribution_path(self)
  end

  protected

  def generate_access_token
    self.access_token = SecureRandom.urlsafe_base64
    # recursive call to ensure uniqueness
    generate_access_token if Contribution.exists?(access_token: self.access_token)
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
    # UserMailer.contribution_alert(self).deliver_now
  end

  def set_contributor_id_for_new_success_referrer
    self.contributor_id = self.referrer_id
  end

  def set_referrer_id_for_new_success_contact
    self.referrer_id = self.success.referrer[:id]
  end

  def missing_referrer_attributes? (attrs)
    # !User.exists?(attrs[:id]) &&
    # (attrs[:email].blank? || attrs[:first_name].blank? || attrs[:last_name].blank?)
  end

end
