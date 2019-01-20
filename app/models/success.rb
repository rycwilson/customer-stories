class Success < ApplicationRecord

  # virtual attribute for keeping track of a new Success that is also created with
  # new contribution (as when a referrer is specified);
  # this only works if the inverse_of option is used on the Success/Contribution association;
  # otherwise, the virtual attribute won't be seen from the contribution callback
  attr_accessor :is_new_record
  def is_new_record?
    !!self.is_new_record
  end

  belongs_to :customer
  has_one :company, through: :customer
  belongs_to :curator, class_name: 'User', foreign_key: 'curator_id'

  has_one :story, dependent: :destroy
  has_many :products_successes, dependent: :destroy
  has_many :products, through: :products_successes,
    after_add: :expire_product_tags_cache, after_remove: :expire_product_tags_cache
  has_many :story_categories_successes, dependent: :destroy
  has_many :story_categories, through: :story_categories_successes,
    after_add: :expire_category_tags_cache, after_remove: :expire_category_tags_cache
  has_many :contributions, inverse_of: :success, dependent: :destroy do
    def invitation_sent
      where.not(status: 'pre_request')
    end
    def submitted
      where(status: 'contribution_submitted')
    end
  end
  # alias the association to user -> Success.find(id).contributors
  # note: contributor is an alias - see contribution.rb
  has_many :contributors, through: :contributions, source: :contributor
  has_many :invitation_templates, -> { distinct }, through: :contributions

  # there is an issue using -> { distinct } here, I think due to there being a default order on ContributorQuestion
  # => works ok if .distinct method is used; see contributions#index
  has_many :contributor_questions, through: :invitation_templates
  alias_attribute :questions, :contributor_questions
  has_many :contributor_answers, through: :contributions
  alias_attribute :answers, :contributor_answers
  has_many :page_views, class_name: 'PageView'
  has_many :story_shares, class_name: 'StoryShare'
  has_many :visitor_actions
  has_many :visitors, through: :visitor_actions

  has_many :results, -> { order(created_at: :asc) }, dependent: :destroy
  has_many :ctas_successes, dependent: :destroy
  has_many :ctas, through: :ctas_successes, source: :call_to_action

  validates_uniqueness_of(:name, scope: :customer_id)

  accepts_nested_attributes_for(:customer, allow_destroy: false)
  accepts_nested_attributes_for(:results, allow_destroy: true)
  # contribution must be rejected if its contributor or referrer is missing required attributes
  # this may happen with a zap (no such validation in the zapier app)
  accepts_nested_attributes_for(:contributions, allow_destroy: false, reject_if: :missing_contributor_or_referrer_attributes?)

  before_save(on: :create) do
    self.is_new_record = true
    convert_description_to_win_story_html
  end

  before_update do
    convert_win_story_html_to_markdown if self.win_story_html.present?
    remove_excess_newlines_from_win_story_text if self.win_story_text.present?
  end

  # after_commit(on: [:create, :destroy]) do
  # end

  # after_commit(on: [:update]) do
  # end

  def convert_description_to_win_story_html
    self.win_story_html.sub!(/(\r\n)+$/, '')
    self.win_story_html.gsub!(/(\r\n)+/, "</p>\r\n<p>")
    self.win_story_html.prepend('<p>').concat('</p>')
  end

  def remove_excess_newlines_from_win_story_text
    self.win_story_text.gsub!(/\s\r\n\r\n\s/, '')
  end

  def convert_win_story_html_to_markdown
    # due to browser behavior (described here https://stackoverflow.com/questions/39362247),
    # data-placeholder attributes aren't fully escaped, and this seems to cause issues when
    # converting to markdown
    if self.win_story_markdown.present?
      self.win_story_markdown = ReverseMarkdown.convert(
        self.win_story_markdown.gsub(/data-placeholder=\".+?<\/div>"/, '')
      )
        .gsub(/-\s\n\n/, "- ")    # remove pointless newlines (or do they have a point?)
        .gsub(/\n\n_/, "\n\n _")  # insert a space in front of answers
    end
  end

  def win_story_recipients_select_options
    recipients_options_self = []  # contributors and referrers tied to this success
    recipients_options_more = []  # all company contributors and referrers

    # need to check the invitation template, so search on contributions
    Contribution
      .includes(:contributor, :referrer)
      .joins(:customer, :invitation_template)
      .where({ customers: { company_id: self.customer.company_id } })
      .where.not({ invitation_templates: { name: 'Customer' } })
      .each do |contribution|
        if contribution.referrer_id
          referrer_option = {
              id: contribution.referrer.id,
              text: "#{contribution.referrer.full_name} (#{contribution.referrer.email})"
            }
          contribution.success_id == self.id ?
            recipients_options_self << referrer_option :
            recipients_options_more << referrer_option
        end
        if contribution.contributor_id
          contributor_option = {
              id: contribution.contributor.id,
              text: "#{contribution.contributor.full_name} (#{contribution.contributor.email})"
            }
          contribution.success_id == self.id ?
            recipients_options_self << contributor_option :
            recipients_options_more << contributor_option
        end
      end
    [
      {
        text: self.name,
        children: recipients_options_self.uniq { |recipient| recipient[:text] }
      },
      {
        text: 'More Contacts',
        children: recipients_options_more.uniq { |recipient| recipient[:text] }
      }
    ]
  end

  # method is used for passing the contributions count to datatables / successes dropdown
  # see successes#index
  def contributions_count
    self.contributions.count
  end

  def display_status
    if (self.contributions.count == 0)
      return "0&nbsp;&nbsp;Contributors added".html_safe
    elsif (self.contributions.invitation_sent.length == 0)
      return "0&nbsp;&nbsp;Contributors invited".html_safe
    else
      return "#{self.contributions.invitation_sent.length}&nbsp;&nbsp;Contributors invited\n" +
             "#{self.contributions.submitted.length}&nbsp;&nbsp;Contributions submitted".html_safe
    end
  end

  def expire_category_tags_cache (category)
    category.company.expire_stories_json_cache
    category.company.increment_category_select_fragments_memcache_iterator
  end

  def expire_product_tags_cache (product)
    product.company.expire_stories_json_cache
    product.company.increment_product_select_fragments_memcache_iterator
  end

  def referrer
    if self.contributions.first.try(:referrer_id) &&
       self.contributions.first.try(:contributor_id) &&
       self.contributions.first.referrer_id == self.contributions.first.contributor_id
      self.contributions.first.referrer
        .slice(:id, :first_name, :last_name, :email, :title, :phone, :linkedin_url)
        .merge(previous_changes: self.contributions.first.referrer.previous_changes)
    else
      nil
    end
  end

  def contact
    customer_contact = self.contributions.find { |c| c.success_contact? }
                           .try(:contributor)
    if customer_contact.present?
      customer_contact
        .slice(:id, :first_name, :last_name, :email, :title, :phone, :linkedin_url)
        .merge(previous_changes: customer_contact.previous_changes)
    else
      nil
    end
  end

  def timestamp
    self.created_at.to_i
  end

  # ref: https://stackoverflow.com/questions/6346134
  def customer_attributes=(attrs)
    # binding.remote_pry
    if attrs['id'].present?
      self.customer = Customer.find(attrs['id'])
    end
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

  # reject a nested contribution if required attributes are missing for either contributor or referrer
  def missing_contributor_or_referrer_attributes? (contribution)
    r_attrs = contribution[:referrer_attributes]
    c_attrs = contribution[:contributor_attributes]
    (r_attrs.present? &&
    !User.exists?(r_attrs[:id]) &&
    (r_attrs[:email].blank? || r_attrs[:first_name].blank? || r_attrs[:last_name].blank?)) ||
    (c_attrs.present? &&
    !User.exists?(c_attrs[:id]) &&
    (c_attrs[:email].blank? || c_attrs[:first_name].blank? || c_attrs[:last_name].blank?))
  end

end

