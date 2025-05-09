class ContributorQuestion < ApplicationRecord

  belongs_to :company
  has_many :templates_questions, dependent: :destroy
  has_many :invitation_templates, through: :templates_questions
  has_many :contributions, through: :invitation_templates
  has_many :contributors, through: :contributions
  has_many :win_story_contributors, through: :contributions
  has_many :contributor_answers, dependent: :destroy
  alias_attribute :answers, :contributor_answers

  default_scope { order(created_at: :asc) }
end
