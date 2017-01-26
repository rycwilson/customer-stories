class AnalyticsController < ApplicationController

  before_action do
    @company = Company.find_by(subdomain: request.subdomain)
    @story = Story.find_by(id: params[:story_id])
    @start_date = Date.strptime(params[:date_range].split(' - ')[0], '%m/%d/%Y' )
    @end_date = Date.strptime(params[:date_range].split(' - ')[1] || @start_date, '%m/%d/%Y' )
  end

  def charts
    respond_to do |format|
      format.json do
        render({
          json: {
            referrer_types: @company.referrer_types_chart_json(@story, @start_date, @end_date),
            unique_visitors: @company.visitors_chart_json(@story, @start_date, @end_date)
          }
        })
      end
    end
  end

  def visitors
    respond_to do |format|
      format.json do
        render({
          json: { data: @company.visitors_table_json(@story, @start_date, @end_date) }
        })
      end
    end
  end

end






