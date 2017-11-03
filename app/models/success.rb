class Success < ActiveRecord::Base

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
      where.not(contribution: nil)
    end
  end
  has_many :results, -> { order(created_at: :asc) }, dependent: :destroy
  # alias the association to user -> Success.find(id).contributors
  # note: contributor is an alias - see contribution.rb
  has_many :contributors, through: :contributions, source: :contributor
  has_many :page_views, class_name: 'PageView'
  has_many :story_shares, class_name: 'StoryShare'
  has_many :visitor_actions
  has_many :visitors, through: :visitor_actions

  has_many :ctas_successes, dependent: :destroy
  has_many :ctas, through: :ctas_successes, source: :call_to_action

  accepts_nested_attributes_for(:customer, allow_destroy: false)
  accepts_nested_attributes_for(:results, allow_destroy: true)
  accepts_nested_attributes_for(:contributions, allow_destroy: false)

  # after_commit(on: [:create, :destroy]) do
  # end

  # after_commit(on: [:update]) do
  # end

  before_save(on: :create) do
    self.is_new_record = true
  end

  # method is used for passing the contributions count to datatables / successes dropdown
  # see successes#index
  def contributions_count
    self.contributions.count
  end

  # method adds a new contributor question associations
  # def add_contributor_questions (question_params)
  #   if question_params.present?
  #     question_params.each() do |index, attrs|
  #       if attrs[:id] && self.contributor_questions.find_by(id: attrs[:id]).nil?
  #         self.contributor_questions << ContributorQuestion.find(attrs[:id])
  #       end
  #     end
  #   end
  # end

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
    category.company.expire_all_stories_cache(true)  # json only
    category.company.increment_category_select_fragments_memcache_iterator
  end

  def expire_product_tags_cache (product)
    product.company.expire_all_stories_cache(true)  # json only
    product.company.increment_product_select_fragments_memcache_iterator
  end

  def referrer
    if self.contributions.first.try(:referrer_id) &&
       self.contributions.first.try(:user_id) &&
       self.contributions.first.referrer_id == self.contributions.first.user_id
      self.contributions.first.referrer.slice(:id, :first_name, :last_name, :email, :title, :phone, :linkedin_url)
    else
      nil
    end
  end
end

