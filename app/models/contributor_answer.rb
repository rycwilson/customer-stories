class ContributorAnswer < ApplicationRecord
  belongs_to :contribution
  belongs_to :contributor_question
end
