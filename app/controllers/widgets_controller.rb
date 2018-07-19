require 'stories_and_widgets'
class WidgetsController < ApplicationController
  include StoriesAndWidgets

  skip_before_action :verify_authenticity_token, only: [:script, :html]
  before_action except: [:track] { @company = Company.find_by(subdomain: request.subdomain) }

  def script
    # handle legacy naming...
    if params[:type] == 'varmour'
      @type = 'carousel'
    elsif params[:type].blank? || params[:type] == 'tab'
      @type = 'fixed-carousel'
    else
      @type = params[:type]
    end
    # set the stylesheet url here, as it's impossible to use the asset path helper in cs.js in a company-specific way
    @stylesheet_url = case @type
    when 'carousel'
      custom_stylesheet_url(@company, 'cs_carousel')
    when 'fixed-carousel'
      custom_stylesheet_url(@company, 'cs_fixed_carousel')
    when 'gallery'
      custom_stylesheet_url(@company, 'cs_gallery')
    else
      ''
    end
    respond_to do |format|
      format.js { render action: 'cs' }
    end
  end

  def html
    respond_to do |format|
      format.js do
        json = { html: widget_html(params) }.to_json
        callback = params[:callback]
        jsonp = callback + "(" + json + ")"
        render(text: jsonp)
      end
    end
  end

  def track
    response.headers.delete('X-Frame-Options')  # allows the tracking iframe to be rendered on host site
    render(layout: false)
  end

  private

  # if invalid category or product filters, return all stories
  def widget_html (params)
    filter_params = get_filters_from_query_or_widget(@company, params, true)
    stories = @company.filter_stories(filter_params)
    if @company.subdomain == 'varmour'
      # ref: https://stackoverflow.com/questions/33732208
      stories = stories.sort_by { |s| [ !s[:published] ? 0 : 1, s[:updated_at] ] }.reverse
    end
    case params[:type]
    when 'carousel'
      partial = 'stories_carousel'
    when 'fixed-carousel'
      partial = 'stories_fixed_carousel'
    when 'gallery'
      stories = stories.first(12)
      partial = 'stories_gallery'
    end
    render_to_string(
      partial: partial,
      layout: false,
      locals: {
        company: @company,
        widget: @company.widget,   # applies to fixed carousel (tab style)
        stories: stories,
        title: 'Customer Stories',
        is_curator: false,
        is_widget: true,
        is_external: true
      }
    )
  end

  def custom_stylesheet_url (company, type)
    URI.join(
      root_url,
      ActionController::Base.helpers.asset_path("custom/#{company.subdomain}/widgets/#{type}.css")
    ).to_s
  end

end






