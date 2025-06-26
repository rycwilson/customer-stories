# frozen_string_literal: true

class Visitor < ApplicationRecord
  has_many :visitor_sessions, dependent: :destroy
  has_many :visitor_actions, through: :visitor_sessions
  has_many :page_views, through: :visitor_sessions, class_name: 'PageView'
  has_many(
    :successes,
    -> { select('successes.*, visitor_actions.timestamp, visitor_sessions.clicky_session_id').distinct },
    through: :visitor_actions
  )
  has_many :stories, through: :successes

  scope :to_company, ->(company_id) { joins(:page_views).where(visitor_actions: { company_id: }).distinct }
  scope :top_to_company, ->(company_id, top) { to_company(company_id).order(visitor_sessions_count: :desc).limit(top) }
end
