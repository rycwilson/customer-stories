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

  scope(
    :to_company_by_date,
    lambda do |company_id,
               curator_id: nil,
               start_date: 30.days.ago.to_date,
               end_date: Date.today,
               show_visitor_source: true,
               story_id: nil|
      start_date = start_date.to_date unless start_date.is_a?(Date)
      end_date = end_date.to_date unless end_date.is_a?(Date)

      group_by, group_range =
        case (end_date - start_date).to_i
        when 0...14
          ['day', start_date.beginning_of_day..end_date.end_of_day]
        when 14...80
          ['week', start_date.beginning_of_week.beginning_of_day...end_date.end_of_week.end_of_day]
        else
          ['month', start_date.beginning_of_month.beginning_of_day...end_date.end_of_month.end_of_day]
        end

      # Group based on the user's time zone
      date_trunc = [
        'DATE_TRUNC(',
          "'#{group_by}', ", # rubocop:disable Layout/ArrayAlignment
          "visitor_sessions.timestamp AT TIME ZONE 'UTC' AT TIME ZONE '#{Time.zone.tzinfo.name}'", # rubocop:disable Layout/ArrayAlignment
        ')'
      ].join('')

      # Format the date as a string so that it is not interpreted by ActiveRecord as UTC
      # (as it will be if `date_trunc` is used directly in GROUP BY)
      formatted_date = "TO_CHAR(#{date_trunc}, 'YYYY-MM-DD')"

      # Convert to UTC since VisitorSession timestamps are stored in UTC
      conditions = {
        visitor_sessions: { timestamp: (group_range.first.utc..group_range.last.utc) },
        visitor_actions: { type: 'PageView', company_id: }
      }
      conditions[:stories] = { id: story_id } if story_id.present?
      conditions[:successes] = { curator_id: } if curator_id.present?

      if show_visitor_source
        # Subquery: for each visitor, date, get the referrer type from their earliest session in the group
        subquery = VisitorSession
          .select([
            'visitor_sessions.visitor_id',
            "#{formatted_date} AS date",
            'visitor_sessions.referrer_type',
            'MIN(visitor_sessions.timestamp) AS min_timestamp'
          ])
          .joins(:visitor_actions)
          .where(visitor_actions: { type: 'PageView', company_id: })
          .where(visitor_sessions: { timestamp: (group_range.first.utc..group_range.last.utc) })
          .group('visitor_sessions.visitor_id', formatted_date, 'visitor_sessions.referrer_type')

        subquery = subquery.joins(visitor_actions: { success: :story }).where(stories: { id: story_id }) if story_id.present?
        subquery = subquery.joins(visitor_actions: { success: :curator }).where(successes: { curator_id: }) if curator_id.present?

        from("(SELECT visitor_id, date, referrer_type, MIN(min_timestamp) AS min_timestamp, '#{group_by}' AS group_by FROM (#{subquery.to_sql}) AS sub GROUP BY visitor_id, date, referrer_type) AS visitor_referrers")
          .select([
            'group_by',
            'date',
            "COUNT(DISTINCT CASE WHEN referrer_type = 'promote' THEN visitor_id END) AS promote",
            "COUNT(DISTINCT CASE WHEN referrer_type = 'link' THEN visitor_id END) AS link",
            "COUNT(DISTINCT CASE WHEN referrer_type = 'search' THEN visitor_id END) AS search",
            # "COUNT(DISTINCT CASE WHEN referrer_type = 'direct' THEN visitor_id END) AS direct",
            "COUNT(DISTINCT CASE WHEN referrer_type NOT IN ('promote','link','search') OR referrer_type IS NULL THEN visitor_id END) AS other"
          ].join(', '))
          .group('group_by, date')
          .order('date ASC')
      else
        select("'#{group_by}' AS group_by, #{formatted_date} AS date, COUNT(DISTINCT visitors.id) AS visitors")
        .joins(visitor_sessions: { visitor_actions: { success: :story } })
        .where(conditions)
        .group(formatted_date)
        .order('date ASC')
      end
    end
  )

  scope :to_company_by_story, lambda { |company_id, curator_id|
    query = joins(visitor_sessions: { visitor_actions: { success: %i[customer story] } })
            .where(visitor_actions: { company_id: })
    query = query.where(successes: { curator_id: }) if curator_id.present?
    query.group('customers.name, stories.title, visitor_actions.company_id')
         .select([
           'customers.name AS customer',
           'stories.title AS story',
           'visitor_actions.company_id',
           'COUNT(DISTINCT visitors.id) AS visitors'
         ].join(', '))
         .order('visitors DESC')
  }
end
