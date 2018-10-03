class ContributorQuestion < ApplicationRecord

  belongs_to :company
  has_many :templates_questions, dependent: :destroy
  has_many :crowdsourcing_templates, through: :templates_questions
  alias_attribute :templates, :crowdsourcing_templates

  default_scope { order(created_at: :asc) }

end
