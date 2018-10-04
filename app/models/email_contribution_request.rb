class EmailContributionRequest < ApplicationRecord

  belongs_to :contribution

  validates :subject, presence: true
  validates :body, presence: true

end
