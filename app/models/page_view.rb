class PageView < VisitorAction
  belongs_to :visitor_session
  has_one :visitor, through: :visitor_session
  belongs_to :success, optional: true

  scope :story, -> { joins(:success) } # excludes index page views
  scope :since, ->(date) { joins(:visitor_session).where(visitor_sessions: { timestamp: date... }) }
end
