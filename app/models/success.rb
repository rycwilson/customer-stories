class Success < ActiveRecord::Base

  belongs_to :customer
  has_one :company, through: :customer
  belongs_to :curator, class_name: 'User', foreign_key: 'curator_id'

  has_one :story, dependent: :destroy
  has_many :products_successes, dependent: :destroy
  has_many :products, through: :products_successes
  has_many :story_categories_successes, dependent: :destroy
  has_many :story_categories, through: :story_categories_successes
  has_many :contributions, dependent: :destroy
  has_many :results, -> { order(created_at: :asc) }, dependent: :destroy
  has_many :prompts, -> { order(created_at: :asc) }, dependent: :destroy
  # alias the association to user -> Success.find(id).contributors
  # note: contributor is an alias - see contribution.rb
  has_many :contributors, through: :contributions, source: :contributor
  has_many :page_views, class_name: 'PageView'
  has_many :story_shares, class_name: 'StoryShare'
  has_many :visitor_actions
  has_many :visitors, through: :visitor_actions

  has_many :ctas_successes, dependent: :destroy
  has_many :ctas, through: :ctas_successes, source: :call_to_action

  accepts_nested_attributes_for(:results, allow_destroy: true)

  # after_commit(on: [:create, :destroy]) do
  # end

  # after_commit(on: [:update]) do
  # end

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

end

