class ContributorAnswer < ApplicationRecord
  belongs_to :contribution
  belongs_to :contributor_question
  has_one :company, through: :contributor_question
  has_one :success, through: :contribution
  has_one :invitation_template, through: :contribution
  alias_attribute :question, :contributor_question
end
