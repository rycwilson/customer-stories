class ContributorQuestion < ApplicationRecord
  belongs_to :company
  has_and_belongs_to_many :invitation_templates, dependent: :destroy, join_table: :templates_questions
  has_and_belongs_to_many :story_categories, dependent: :destroy
  has_and_belongs_to_many :products, dependent: :destroy
  has_many :contributions, through: :invitation_templates
  has_many :contributors, through: :contributions
  has_many :win_story_contributors, through: :contributions
  has_many :contributor_answers, dependent: :destroy
  alias_attribute :answers, :contributor_answers

  default_scope { order(created_at: :asc) }
end
