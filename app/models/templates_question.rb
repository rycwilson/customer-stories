class TemplatesQuestion < ActiveRecord::Base

  belongs_to :crowdsourcing_template
  belongs_to :contributor_question

end
