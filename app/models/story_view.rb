class StoryView < VisitorAction

  scope :company_views, ->(company_id) {
    joins(visitor_session: {}, success: { customer: {} })
    .where(customers: { company_id: company_id })
  }

  scope :company_views_since, ->(company_id, days_ago) {
    company_views(company_id)
    .where('visitor_sessions.timestamp >= ?', days_ago.days.ago.beginning_of_day)
  }

end