class ContributorInvitation < ApplicationRecord
  belongs_to :contribution

  enum status: { pending: 0, sent: 1 }
end
