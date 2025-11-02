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
               story_id: nil,
               category_id: nil,
               product_id: nil|
      start_date = start_date.to_date unless start_date.is_a?(Date)
      end_date = end_date.to_date unless end_date.is_a?(Date)

      group_unit, group_range =
        case (end_date - start_date).to_i
        when 0...14
          ['day', start_date.beginning_of_day..end_date.end_of_day]
        when 14...100
          ['week', start_date.beginning_of_week.beginning_of_day...end_date.end_of_week.end_of_day]
        else
          ['month', start_date.beginning_of_month.beginning_of_day...end_date.end_of_month.end_of_day]
        end

      # Group based on the user's time zone
      date_trunc = [
        'DATE_TRUNC(',
          "'#{group_unit}', ", # rubocop:disable Layout/ArrayAlignment
          "visitor_sessions.timestamp AT TIME ZONE 'UTC' AT TIME ZONE '#{Time.zone.tzinfo.name}'", # rubocop:disable Layout/ArrayAlignment
        ')'
      ].join('')

      # Format the date as a string so that it is not interpreted by ActiveRecord as UTC
      # (as it will be if `date_trunc` is used directly in GROUP BY)
      formatted_date = "TO_CHAR(#{date_trunc}, 'YYYY-MM-DD')"

      # For each visitor, date, get the referrer type from their earliest session in the group
      subquery = VisitorSession
        .select([
          'visitor_sessions.visitor_id',
          "#{formatted_date} AS group_start_date",
          'visitor_sessions.referrer_type',
          'MIN(visitor_sessions.timestamp) AS min_timestamp'
        ].join(','))
        .joins(:visitor_actions)
        .where(visitor_actions: { type: 'PageView', company_id: })
        .where(visitor_sessions: { timestamp: (group_range.first.utc..group_range.last.utc) })
        .group('visitor_sessions.visitor_id', formatted_date, 'visitor_sessions.referrer_type')
      if curator_id.present?
        subquery = subquery.joins(visitor_actions: { success: :curator })
                            .where(successes: { curator_id: })
      end
      if story_id.present?
        subquery = subquery.joins(visitor_actions: { success: :story })
                            .where(stories: { id: story_id })
      end

      from(<<-SQL.gsub(/^\s+/, '')
        (
          SELECT
            visitor_id,
            group_start_date,
            referrer_type,
            MIN(min_timestamp) AS min_timestamp,
            '#{group_unit}' AS group_unit
          FROM (#{subquery.to_sql}) AS sub
          GROUP BY visitor_id, group_start_date, referrer_type
        ) AS visitor_referrers
      SQL
          ).select([
            'group_unit',
            'group_start_date',
            "COUNT(DISTINCT CASE WHEN referrer_type = 'promote' THEN visitor_id END) AS promote",
            "COUNT(DISTINCT CASE WHEN referrer_type = 'link' THEN visitor_id END) AS link",
            "COUNT(DISTINCT CASE WHEN referrer_type = 'search' THEN visitor_id END) AS search",
            "COUNT(DISTINCT CASE WHEN referrer_type NOT IN ('promote','link','search') THEN visitor_id END) AS other"
          ].join(', '))
          .group('group_unit, group_start_date')
          .order('group_start_date ASC')
    end
  )

  scope(
    :to_company_by_story,
    lambda do |company_id, curator_id: nil, start_date: 30.days.ago.to_date, end_date: Date.today|
      start_date = start_date.to_date unless start_date.is_a?(Date)
      end_date = end_date.to_date unless end_date.is_a?(Date)

      # Build the subquery: for each visitor, customer, story, company, get their referrer_type
      inner_subquery = Visitor
        .joins(visitor_sessions: { visitor_actions: { success: %i[customer story] } })
        .where(visitor_actions: { type: 'PageView', company_id: })
        .where(visitor_sessions: { timestamp: (start_date.beginning_of_day.utc..end_date.end_of_day.utc) })
        .select([
          'customers.name AS customer',
          'stories.title AS story',
          'visitor_actions.company_id',
          'visitors.id AS visitor_id',
          'visitor_sessions.referrer_type'
        ].join(', '))
      inner_subquery = inner_subquery.where(successes: { curator_id: }) if curator_id.present?

      # Outer subquery: group and count by referrer type
      outer_select = [
        'customer',
        'story',
        "COUNT(DISTINCT CASE WHEN referrer_type = 'promote' THEN visitor_id END) AS promote",
        "COUNT(DISTINCT CASE WHEN referrer_type = 'link' THEN visitor_id END) AS link",
        "COUNT(DISTINCT CASE WHEN referrer_type = 'search' THEN visitor_id END) AS search",
        "COUNT(DISTINCT CASE WHEN referrer_type NOT IN ('promote','link','search') OR referrer_type IS NULL THEN visitor_id END) AS other"
      ].join(', ')

      outer_query = "(SELECT #{outer_select} FROM (#{inner_subquery.to_sql}) AS visitor_referrers GROUP BY customer, story) AS visitor_story_counts"

      from(outer_query)
        .select('customer, story, promote, link, search, other')
        .order(Arel.sql('promote + link + search + other DESC'))
    end
  )
end
