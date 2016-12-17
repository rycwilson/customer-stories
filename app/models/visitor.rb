class Visitor < ActiveRecord::Base

  has_many :visitor_sessions, dependent: :destroy
  has_many :visitor_actions, through: :visitor_sessions
  has_many :page_views, through: :visitor_sessions, class_name: 'PageView'
  has_many :successes, through: :visitor_actions

  # scope :company_all, ->(company_id) {
  #   joins(:page_views)
  #   .where(visitor_actions: { company_id: company_id })
  # }

  scope :company_top, ->(company_id, top) {
    joins(:page_views)
    .where(visitor_actions: { company_id: company_id })
    .uniq
    .order(visitor_sessions_count: :desc)
    .limit(top)
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
