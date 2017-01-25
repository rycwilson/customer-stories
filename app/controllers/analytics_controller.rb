class AnalyticsController < ApplicationController

  before_action do
    @company = Company.find_by(subdomain: request.subdomain)
    @story = Story.find_by(id: params[:story_id])
    @start_date = Date.strptime(params[:date_range].split(' - ')[0], '%m/%d/%Y' )
    @end_date = Date.strptime(params[:date_range].split(' - ')[1] || @start_date, '%m/%d/%Y' )
  end

  def charts
    @referrer_types = referrer_types_data(@company, @story || 'all', @start_date, @end_date)
    @unique_visitors = unique_visitors_data(@company, @story || 'all', @start_date, @end_date)
    respond_to { |format| format.js }
  end

  def visitors
    @visitors =
      VisitorSession.distinct.joins(:visitor, :visitor_actions)
        .where('timestamp >= ? AND timestamp <= ?',
                @start_date.beginning_of_day, @end_date.end_of_day)
        .where(visitor_actions: visitor_actions_conditions(@company, @story || 'all'))
        .group(:organization, 'visitors.id')
        .count
        .group_by { |session_data, session_count| session_data[0] }
        .to_a.map do |org_data|
          visitors = []
          visits = 0
          org_data[1].each do |visitor|
            visitors << visitor[0][1]
            visits += visitor[1]
          end
          # the whitespace is for the 'show details' column
          [ '', org_data[0], visitors.count, visits ]
        end
        .sort_by { |org| org[0] || '' }

    # binding.remote_pry

    respond_to do |format|
      format.json { render({ json: { data: @visitors } }) }
    end
  end

  def referrer_types_data company, target, start_date, end_date
    VisitorSession.select(:referrer_type)
      .joins(:visitor_actions)
      .where(visitor_actions: visitor_actions_conditions(company, target))
      .where('timestamp > ? AND timestamp < ?', start_date.beginning_of_day, end_date.end_of_day)
      .group_by { |session| session.referrer_type }
      .map { |type, records| [type,records.count] }
  end

  def unique_visitors_data company, target, start_date, end_date

    num_days = (start_date..end_date).count

    if num_days < 21

      visitors = VisitorSession.distinct
        .includes(:visitor)
        .joins(:visitor_actions)
        .where(visitor_actions: visitor_actions_conditions(company, target))
          .where('timestamp > ? AND timestamp < ?', start_date.beginning_of_day, end_date.end_of_day)
          .group_by { |session| session.timestamp.to_date }
          .sort_by { |date, sessions| date }.to_h
          .map do |date, sessions|
            [ date.strftime('%-m/%-d/%y'), sessions.map { |session| session.visitor }.uniq.count ]
          end
        if start_date == end_date || visitors.empty?
          visitors
        else
          visitors = fill_daily_gaps(visitors, start_date, end_date)
        end

    elsif num_days < 120

      # TODO: Perform the count without actually loading any objects
      visitors = VisitorSession.distinct
        .includes(:visitor)
        .joins(:visitor_actions)
        .where(visitor_actions: visitor_actions_conditions(company, target))
        .where('timestamp > ? AND timestamp < ?',
               start_date.beginning_of_week.beginning_of_day, end_date.end_of_week.end_of_day)
        .group_by { |session| session.timestamp.to_date.beginning_of_week }
        .sort_by { |date, sessions| date }.to_h
        .map do |date, sessions|
          [ date.strftime('%-m/%-d/%y'),
            sessions.map { |session| session.visitor }.uniq.count ]
        end
      if visitors.empty?
        visitors
      else
        visitors = fill_weekly_gaps(visitors, start_date, end_date)
      end

    else

      visitors = VisitorSession.distinct
        .includes(:visitor)
        .joins(:visitor_actions)
        .where(visitor_actions: visitor_actions_conditions(company, target))
        .where('timestamp >= ? AND timestamp <= ?',
               start_date.beginning_of_month.beginning_of_day, end_date.end_of_month.end_of_day)
        .group_by { |session| session.timestamp.to_date.beginning_of_month }
        .sort_by { |date, sessions| date }.to_h
        .map do |date, sessions|
          [ date.strftime('%-m/%y'),
            sessions.map { |session| session.visitor }.uniq.count ]
        end
      visitors
      # if visitors.empty?
      #   visitors
      # else
      #   visitors = fill_monthly_gaps(visitors, start_date, end_date)
      # end

    end
  end

  def visitor_actions_conditions company, target
    if target == 'all'
      visitor_action_conditions = { company_id: company.id }
    else
      visitor_action_conditions = { company_id: company.id,
                                    success_id: target.success_id }
    end
  end

end






