class AnalyticsController < ApplicationController
# before_action { binding.remote_pry }
  before_action { @company = Company.find_by(subdomain: request.subdomain) }
  before_action except: [:stories] do
    @story = Story.find_by(id: params[:story_id])
    @start_date = Date.strptime(params[:date_range].split(' - ')[0], '%m/%d/%Y' )
    @end_date = Date.strptime(params[:date_range].split(' - ')[1] || @start_date, '%m/%d/%Y' )
  end

  def charts
    if params[:initial_load] == 'true'
      default_referrer_types = @company.referrer_types_chart_json
      default_visitors = @company.visitors_chart_json
      # default_actions = @company.actions_chart_json
    else
      default_referrer_types = default_visitors = nil
    end
    respond_to do |format|
      format.json do
        render({
          json: {
            charts: {
              referrerTypes: default_referrer_types || @company.referrer_types_chart_json(@story, @start_date, @end_date),
              visitors: default_visitors || @company.visitors_chart_json(@story, @start_date, @end_date)
              # actions: default_actions || @company.actions_chart_json(@story, @start_date, @end_date)
            }
          }
        })
      end
    end
  end

  def stories
    respond_to do |format|
      format.json do
        render(json: { data: @company.stories_table_json })
      end
    end
  end

  def visitors
    if params[:default_data] == 'true'
      default_visitors = @company.visitors_table_json(@story, @start_date, @end_date)
    else
      default_visitors = nil
    end
    respond_to do |format|
      format.json do
        render({
          json: { data: default_visitors || @company.visitors_table_json(@story, @start_date, @end_date) }
        })
      end
    end
  end

end






