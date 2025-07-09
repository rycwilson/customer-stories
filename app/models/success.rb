# frozen_string_literal: true

class Success < ApplicationRecord
  # virtual attribute for keeping track of a new Success that is also created with
  # new contribution (as when a referrer is specified);
  # this only works if the inverse_of option is used on the Success/Contribution association;
  # otherwise, the virtual attribute won't be seen from the contribution callback
  attr_accessor :is_new_record

  def is_new_record?
    !!is_new_record
  end

  # Since this table was added before Rails 5 (when belongs_to associations became required),
  # the foreign keys associated with the belongs_to associations are presently nullable.
  # Therefore we need to explicitly require the association.
  # TODO: enforce this in the database schema
  belongs_to :customer
  belongs_to(
    :curator,
    -> { select(:id, :first_name, :last_name, :email, :title, :phone) },
    class_name: 'User',
    foreign_key: 'curator_id'
  )
  validates :customer, :curator, presence: true

  has_one :company, through: :customer
  has_one :story, dependent: :destroy

  # leave this in place until production db is migrated!
  # but delete it when running bin/rails db:seed
  # has_many :results, dependent: :destroy

  has_and_belongs_to_many :products
  has_and_belongs_to_many :story_categories
  alias_method :categories, :story_categories

  has_many :contributions, inverse_of: :success, dependent: :destroy
  has_many(
    :contributions_for_win_story,
    lambda {
      joins(:contributor_answers)
      .where.not(contributions: { contributor_answers: { id: nil } })
      .select(:id, :success_id, :contributor_id, :invitation_template_id, :created_at)
      .distinct
    },
    class_name: 'Contribution'
  )

  has_many :contributors, through: :contributions
  has_many :invitation_templates, -> { unscope(:order).distinct }, through: :contributions
  has_many(
    :invitation_template_identifiers,
    -> { select(:id, :name).distinct },
    through: :contributions,
    source: :invitation_template
  )

  # must select the fields that are used in the default_scope of each model
  has_many(
    :contributor_questions,
    lambda {
      select(' \
        invitation_templates.name, \
        templates_questions.created_at, \
        contributor_questions.created_at \
      ').distinct
    },
    through: :invitation_templates
  )
  alias_method :questions, :contributor_questions
  has_many :contributor_answers, through: :contributions
  alias_method :answers, :contributor_answers
  has_many :page_views, class_name: 'PageView'
  has_many :story_shares, class_name: 'StoryShare'
  has_many :visitor_actions
  has_many :visitors, through: :visitor_actions

  has_and_belongs_to_many :ctas, class_name: 'CallToAction', join_table: 'ctas_successes'
  # default_scope { order(name: :asc) }

  # Stories can be created without a customer win, in which case a placeholder customer win is 
  # created with name = '' and placeholder = true.
  # TODO: modify associations so that stories can exist independently
  validate :named_or_placeholder
  validates_uniqueness_of(:name, scope: :customer_id, unless: -> { placeholder })

  # validate :tag_has_same_company

  accepts_nested_attributes_for(:customer, allow_destroy: false)
  # contribution must be rejected if its contributor or referrer is missing required attributes
  # this may happen with a zap (no such validation in the zapier app)
  accepts_nested_attributes_for(
    :contributions,
    allow_destroy: false,
    reject_if: :missing_contributor_or_referrer_attributes?
  )

  scope :real, -> { where(placeholder: false) }
  scope :for_datatable, lambda {
    real
      .joins(:customer, :curator)
      .left_outer_joins(:story)
      .select(
        :id, :name, :created_at, :win_story_completed,
        customers: { id: :customer_id, name: :customer_name },
        users: { id: :curator_id, first_name: :curator_first, last_name: :curator_last },
        stories: { id: :story_id, title: :story_title }
      )
  }

  before_save { self.is_new_record = true if new_record? }

  before_create do
    convert_description_to_win_story_html if win_story_html.present?
  end

  before_update do
    # because associations are saved and self foreign key is updated, this gets run
    # on a create action - which we don't want to happen!
    # ref https://github.com/rails/rails/issues/29864
    unless is_new_record
      convert_win_story_html_to_markdown if win_story_markdown.present?
      remove_excess_newlines_from_win_story_text if win_story_text.present?
    end
  end

  def convert_description_to_win_story_html
    win_story_html.sub!(/(\r\n)+$/, '')
    win_story_html.gsub!(/(\r\n)+/, "</p>\r\n<p>")
    win_story_html.prepend('<p>').concat('</p>')
  end

  def remove_excess_newlines_from_win_story_text
    win_story_text.gsub!(/\s\r\n\r\n\s/, '')
  end

  def convert_win_story_html_to_markdown
    # due to browser behavior (described here https://stackoverflow.com/questions/39362247),
    # data-placeholder attributes aren't fully escaped, and this seems to cause issues when
    # converting to markdown
    self.win_story_markdown =
      ReverseMarkdown.convert(win_story_markdown.gsub(%r{data-placeholder=".+?</div>"}, ''))
                     # remove pointless newlines (or do they have a point?)
                     .gsub(/-\s\n\n/, '- ')
                     # insert a space in front of answers
                     .gsub(/\n\n_/, "\n\n _")
  end

  def win_story_recipients_select_options
    recipients_options_self = []  # contributors and referrers tied to this success
    recipients_options_more = []  # all company contributors and referrers

    # need to check the invitation template, so search on contributions
    Contribution
      .includes(:contributor, :referrer)
      .joins(:customer, :invitation_template)
      .where({ customers: { company_id: customer.company_id } })
      .where.not({ invitation_templates: { name: 'Customer' } })
      .each do |contribution|
        if contribution.referrer_id
          referrer_option = {
            id: contribution.referrer.id,
            text: "#{contribution.referrer.full_name} (#{contribution.referrer.email})"
          }
          if contribution.success_id == id
            recipients_options_self << referrer_option
          else
            recipients_options_more << referrer_option
          end
        end
        next unless contribution.contributor_id

        contributor_option = {
          id: contribution.contributor.id,
          text: "#{contribution.contributor.full_name} (#{contribution.contributor.email})"
        }
        if contribution.success_id == id
          recipients_options_self << contributor_option
        else
          recipients_options_more << contributor_option
        end
      end
    [
      { text: name, children: recipients_options_self.uniq { |recipient| recipient[:text] } },
      { text: 'More Contacts', children: recipients_options_more.uniq { |recipient| recipient[:text] } }
    ]
  end

  def display_status
    'moved to view helper'
  end

  # this is just here for test illustration
  def removed_story_category(story_category); end

  def referrer
    _contributions = contributions.select(:referrer_id, :contributor_id)
    if contributions.first.try(:referrer_id) &&
       contributions.first.try(:contributor_id) &&
       contributions.first.referrer_id == contributions.first.contributor_id
      contributions.first
                   .referrer
                   .slice(:id, :first_name, :last_name, :email, :title, :phone)
                   .merge(previous_changes: contributions.first.referrer.previous_changes)
    end
  end

  def contact
    customer_contact = contributions.find(&:success_contact?)&.contributor
    return unless customer_contact.present?

    customer_contact
      .slice(:id, :first_name, :last_name, :email, :title, :phone)
      .merge(previous_changes: customer_contact.previous_changes)
  end

  def select_option
    [name, "success-#{id}", { 'data-customer-id' => customer.id }]
  end

  # ref: https://stackoverflow.com/questions/6346134
  def customer_attributes=(attrs)
    self.customer = Customer.find(attrs['id']) if attrs['id'].present?
    super
  end

  # https://stackoverflow.com/questions/38369515
  # def save_with_nested_attributes (company)
  #   transaction do
  #     if self.customer_attributes[:id]
  #       self.customer = Customer.find(self.customer_attibutes[:id])
  #     else
  #       customer = Customer.create(name: self.customer_attributes[:name], company_id: c)
  #   end
  # end

  # private

  # Reject a nested contribution if required attributes are missing for either contributor
  # or referrer
  def missing_contributor_or_referrer_attributes?(contribution)
    r_attrs = contribution[:referrer_attributes]
    c_attrs = contribution[:contributor_attributes]
    (
      r_attrs.present? and
      !User.exists?(r_attrs[:id]) and
      r_attrs[:email].blank? or r_attrs[:first_name].blank? or r_attrs[:last_name].blank?
    ) or (
      c_attrs.present? and
      !User.exists?(c_attrs[:id]) and
      c_attrs[:email].blank? or c_attrs[:first_name].blank? or c_attrs[:last_name].blank?
    )
  end

  def new_story_path
    Rails.application.routes.url_helpers.new_success_story_path(self)
  end

  def named_or_placeholder
    if name.blank? && !placeholder?
      errors.add(:name, 'must be present if object is not a placeholder')
    elsif name.present? && placeholder?
      errors.add(:placeholder, 'object cannot have a name')
    end
  end
end
