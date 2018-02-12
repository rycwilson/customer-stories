class TemplatesQuestion < ActiveRecord::Base

  belongs_to :crowdsourcing_template
  belongs_to :contributor_question

  after_destroy { self.contributor_question.destroy if self.contributor_question.present? && self.contributor_question.templates.length == 0 }

  default_scope { order(created_at: :asc) }

end
