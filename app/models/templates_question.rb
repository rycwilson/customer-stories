class TemplatesQuestion < ApplicationRecord

  belongs_to :invitation_template
  belongs_to :contributor_question

  after_destroy { self.contributor_question.destroy if self.contributor_question.present? && self.contributor_question.invitation_templates.length == 0 }

  default_scope { order(created_at: :asc) }

end
