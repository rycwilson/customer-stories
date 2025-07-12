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

  scope :to_company_by_date, lambda { |company_id, **options|
    story_id = options[:story_id]
    start_date = options[:start_date]&.to_date || 30.days.ago.to_date
    # start_date = options[:start_date]&.to_date || 90.months.ago.to_date
    end_date = options[:end_date]&.to_date || Date.today
    # end_date = options[:end_date]&.to_date || 80.months.ago.to_date
    days_between = (end_date - start_date).to_i
    group_by, group_range =
      case days_between
      when 0...21
        ['day', start_date.beginning_of_day..end_date.end_of_day]
      when 21...120
        ['week', start_date.beginning_of_week.beginning_of_day...end_date.end_of_week.end_of_day]
      else
        ['month', start_date.beginning_of_month.beginning_of_day...end_date.end_of_month.end_of_day]
      end
    date_trunc = "DATE_TRUNC('#{group_by}', visitor_sessions.timestamp)"
    where_conditions = {
      visitor_sessions: { timestamp: group_range },
      visitor_actions: { company_id: }
    }
    where_conditions[:stories] = { id: story_id } if story_id.present?
    select("#{date_trunc} AS date, COUNT(DISTINCT visitors.id) AS visitors")
      .joins(visitor_sessions: { visitor_actions: { success: :story } })
      .where(where_conditions)
      .group(date_trunc)
      .order('date ASC')
  }

  scope :to_company_by_story, lambda { |company_id|
    joins(visitor_sessions: { visitor_actions: { success: %i[customer story] } })
      .where(visitor_actions: { company_id: })
      .group('customers.name, stories.title, visitor_actions.company_id')
      .select([
        'customers.name AS customer',
        'stories.title AS story',
        'visitor_actions.company_id',
        'COUNT(DISTINCT visitors.id) AS visitors'
      ].join(', '))
      .order('visitors DESC')
  }
end
