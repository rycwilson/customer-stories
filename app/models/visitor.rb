class Visitor < ApplicationRecord

  has_many :visitor_sessions, dependent: :destroy
  has_many :visitor_actions, through: :visitor_sessions
  has_many :page_views, through: :visitor_sessions, class_name: 'PageView'
  has_many :successes, -> { select('successes.*, visitor_actions.timestamp, visitor_sessions.clicky_session_id').distinct }, through: :visitor_actions
  has_many :stories, through: :successes

  scope :company_all, ->(company_id) {
    joins(:page_views)
    .where(visitor_actions: { company_id: company_id })
    .distinct
  }

  scope :company_top, ->(company_id, top) {
    company_all(company_id)
    .order(visitor_sessions_count: :desc)
    .limit(top)
  }

  scope :company_index_visitors, ->(company_id) {
    company_all(company_id)
    .where(visitor_actions: { success_id: nil })
  }

  # ref: http://stackoverflow.com/questions/8696005/rails-3-activerecord-order-by-count-on-association
  # but it doesn't work!
  # scope :company_top, ->(company_id, top) {
  #   company_all(company_id)
  #   .select('visitors.id, visitors.clicky_uid, COUNT(visitor_sessions.id) AS sessions_count')
  #   .joins(:visitor_sessions)
  #   .group("visitor_sessions.id, visitors.#{Visitor.column_names.join(',visitors.')}")
  #   .order('sessions_count DESC')
  #   .limit(count)
  # }

end
