class PageView < VisitorAction

  has_one :visitor, through: :visitor_session

  scope :company_story_views, ->(company_id) {
    joins(visitor_session: {}, success: { customer: {} })  # visitor_session needed below
    .where(customers: { company_id: company_id })
    .where.not(success_id:'')  # story views only, not index views
  }

  scope :company_story_views_since, ->(company_id, days_ago) {
    company_views(company_id)
    .where('visitor_sessions.timestamp >= ?', days_ago.days.ago.beginning_of_day)
  }

  scope :company_index_views, ->(company_id) {
    joins(:visitor)
    .where(success_id: nil,
           visitors: { company_id: company_id })
  }

end