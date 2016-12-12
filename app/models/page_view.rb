class PageView < VisitorAction

  has_one :visitor, through: :visitor_session

  # include visitor_session since it's needed below for comparison and
  # ultimately the timestamp needs to be templated
  scope :company_story_views, ->(company_id) {
    includes(visitor_session: { visitor: {} })  # visitor_session needed below
    .where(visitors: { company_id: company_id })
    .where.not(success_id: nil)  # story views only, not index views
  }

  scope :company_story_views_since, ->(company_id, days_offset) {
    company_story_views(company_id)
    .where('visitor_sessions.timestamp > ?', days_offset.days.ago)
  }

  scope :company_index_views, ->(company_id) {
    joins(:visitor)
    .where(success_id: nil, visitors: { company_id: company_id })
  }

end