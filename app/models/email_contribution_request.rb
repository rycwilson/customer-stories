class EmailContributionRequest < ActiveRecord::Base

  belongs_to :contribution

  validates :subject, presence: true
  validates :body, presence: true

end
