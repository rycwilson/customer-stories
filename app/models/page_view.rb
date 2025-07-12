# frozen_string_literal: true

class PageView < VisitorAction
  scope :story, -> { joins(:success) } # excludes index page views
  scope :since, ->(date) { joins(:visitor_session).where(visitor_sessions: { timestamp: date... }) }
end
