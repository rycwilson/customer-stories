class Success < ActiveRecord::Base

  belongs_to :company
  belongs_to :customer
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
  has_many :story_views, class_name: 'StoryView'
  has_many :story_shares, class_name: 'StoryShare'
  has_many :visitor_actions
  has_many :visitors, through: :visitor_actions

  def create_default_prompts
    self.prompts << Prompt.create(description: "What was the challenge?") <<
                    Prompt.create(description: "What was the solution?") <<
                    Prompt.create(description: "What was the measure of success achieved?")
  end

end

