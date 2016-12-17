class PageView < VisitorAction

  has_one :visitor, through: :visitor_session

  scope :company_story_views, ->(company_id) {
    joins(:success)  # story views only, not index views
    .where(company_id: company_id)
  }

  scope :company_story_views_since, ->(company_id, days_offset) {
    company_story_views(company_id)
    .where('visitor_sessions.timestamp > ?', days_offset.days.ago)
  }

  scope :company_index_views, ->(company_id) {
    where(company_id: company_id, success_id: nil)
  }

end