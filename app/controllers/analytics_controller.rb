class AnalyticsController < ApplicationController

  def charts
    company = Company.find_by(subdomain: request.subdomain)
    story = Story.find_by(id: params[:charts][:story_id])
    start_date = Date.strptime(params[:charts][:date_range].split(' - ')[0], '%m/%d/%Y' )
    end_date = Date.strptime(params[:charts][:date_range].split(' - ')[1] || start_date, '%m/%d/%Y' )
    @referrer_types = referrer_types_data(company, story || 'all', start_date, end_date)
    @unique_visitors = unique_visitors_data(company, story || 'all', start_date, end_date)
    respond_to { |format| format.js }
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

    if (start_date..end_date).count < 21

      visitors = VisitorSession.distinct
        .includes(:visitor)
        .joins(:visitor_actions)
        .where(visitor_actions: visitor_actions_conditions(company, target))
        .where('timestamp > ? AND timestamp < ?', start_date.beginning_of_day, end_date.end_of_day)
        .group_by { |session| session.timestamp.to_date }
        .sort_by { |date, sessions| date }.to_h
        .map do |date, sessions|
          [ date.strftime('%-m/%-d'), sessions.map { |session| session.visitor }.uniq.count ]
        end

      fill_date_gaps(visitors, start_date, end_date)

    elsif (start_date..end_date).count < 120

      # TODO: Perform the count without actually loading any objects
      VisitorSession.distinct
        .includes(:visitor)
        .joins(:visitor_actions)
        .where(visitor_actions: visitor_actions_conditions(company, target))
        .where('timestamp > ? AND timestamp < ?',
               start_date.beginning_of_week.beginning_of_day, end_date.end_of_week.end_of_day)
        .group_by { |session| session.timestamp.to_date.beginning_of_week }
        .sort_by { |date, sessions| date }.to_h
        .map do |date, sessions|
          [ date.strftime('%-m/%-d'),
            sessions.map { |session| session.visitor }.uniq.count ]
        end
    else
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

  def fill_date_gaps visitors, start_date, end_date
    start_dates = []
    (Date.strptime(visitors[0][0], "%m/%d") - start_date).to_i.times do |index|
      start_dates << [(start_date + index).strftime("%-m/%-d"), 0]
    end
    all_dates = start_dates +
      visitors.each_cons(2).each_with_index.flat_map do |(prev_date, next_date), index|
        prev_datep = Date.strptime(prev_date[0], '%m/%d')
        next_datep = Date.strptime(next_date[0], '%m/%d')
        return_arr = [prev_date]
        delta = (next_datep - prev_datep).to_i
        delta += 365 if delta < 0
        if delta > 1
          (delta - 1).times do |i|
            return_arr.insert(1, [(next_datep - (i + 1)).strftime("%-m/%-d"), 0])
          end
        end
        if (index == visitors.length - 2)
          return_arr << next_date
        else
          return_arr
        end
      end
    end_delta = (end_date - Date.strptime(all_dates.last[0], "%m/%d")).to_i
    end_delta += 365 if end_delta < 0
    end_delta.times do |index|
      all_dates << [(Date.strptime(all_dates.last[0], "%m/%d") + 1).strftime("%-m/%-d"), 0]
    end
    all_dates
  end

end






