class VisitorSession < ApplicationRecord

  belongs_to :visitor, counter_cache: true
  has_many :visitor_actions, dependent: :destroy
  has_many :page_views
  has_many :story_shares
  has_many :successes, -> { select('successes.*, visitor_actions.timestamp').distinct }, through: :visitor_actions
  has_many :stories, through: :successes

  default_scope { order(:clicky_session_id) }

  scope :company_all, ->(company_id) {
    joins(:visitor_actions)
    .where(visitor_actions: { company_id: company_id })
    .distinct
  }

end
