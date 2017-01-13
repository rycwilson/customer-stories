class AnalyticsController < ApplicationController

  def charts
    company = Company.find_by(subdomain: request.subdomain)
    story = Story.find_by(id: params[:charts][:story_id])
    # binding.remote_pry
    start_date = Date.strptime(params[:charts][:date_range].split(' - ')[0], '%m/%d/%Y' )
    end_date = Date.strptime(params[:charts][:date_range].split(' - ')[1] || start_date, '%m/%d/%Y' )

    # binding.remote_pry
    @referrer_types = get_referrer_type_data(company, story || 'all', start_date, end_date)
    respond_to { |format| format.js }
  end

  def get_referrer_type_data company, target, start_date, end_date
    if target == 'all'
      visitor_action_conditions = { company_id: company.id }
    else
      visitor_action_conditions = { company_id: company.id,
                                    success_id: target.success_id }
    end
    VisitorSession.select(:referrer_type)
      .joins(:visitor_actions)
      .where(visitor_actions: visitor_action_conditions)
      .where('timestamp > ? AND timestamp < ?', start_date.beginning_of_day, end_date.end_of_day)
      .group_by { |session| session.referrer_type }
      .map { |type, records| [type,records.count] }
  end

end