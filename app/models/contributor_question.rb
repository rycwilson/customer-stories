class ContributorQuestion < ActiveRecord::Base

  belongs_to :company
  has_many :templates_questions, dependent: :destroy
  has_many :crowdsourcing_templates, through: :templates_questions
  alias_attribute :templates, :crowdsourcing_templates
  has_many :contributor_answers
  alias_attribute :answers, :contributor_answers

  default_scope { order(created_at: :asc) }

end
