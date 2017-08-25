class CrowdsourcingTemplate < ActiveRecord::Base

  belongs_to :company
  has_many :templates_questions, dependent: :destroy
  has_many :contributor_questions, through: :templates_questions
  accepts_nested_attributes_for :contributor_questions, allow_destroy: true
  has_many :contributions

  after_commit(on: :create) do
    self.contributor_questions << self.company.contributor_questions.default
  end

end
