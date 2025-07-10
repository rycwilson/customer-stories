# frozen_string_literal: true

class PageView < VisitorAction
  scope :story, -> { joins(:success) } # excludes index page views
  scope :since, ->(date) { joins(:visitor_session).where(visitor_sessions: { timestamp: date... }) }

  # NOTE: Any field that is selected and not aggregated must be included in the GROUP BY clause.
  # Use a left_outer_joins to account for some page views being tied to stories#index
  scope :visitors_by_story, lambda {
    left_outer_joins(success: %i[customer story])
      .joins(visitor_session: :visitor)
      .group('customers.name, stories.title')
      .select(Arel.sql([
        'customers.name AS customer',
        'stories.title',
        'COUNT(DISTINCT visitors.id) AS visitors'
      ].join(', ')))
      .order('visitors DESC')
  }
end
