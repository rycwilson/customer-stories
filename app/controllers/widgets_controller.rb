require 'stories_and_widgets'
class WidgetsController < ApplicationController
  include StoriesAndWidgets

  skip_before_action :verify_authenticity_token, only: [:script, :html]
  before_action except: [:track] { @company = Company.find_by(subdomain: request.subdomain) }

  def script
    # type is either carousel or fixed-carousel
    if params[:type] == 'varmour'
      @type = 'carousel'
    elsif params[:type].blank? || params[:type] == 'tab'
      @type = 'fixed-carousel'
    else
      @type = params[:type]
    end
    respond_to do |format|
      format.js { render action: 'cs' }
    end
  end

  def html
    respond_to do |format|
      format.js do
        # Build a JSON object containing our HTML
        json = { html: widget_html(params) }.to_json
        # Get the name of the JSONP callback created by jQuery
        callback = params[:callback]
        # Wrap the JSON object with a call to the JSONP callback
        jsonp = callback + "(" + json + ")"
        # Send result to the browser
        render text: jsonp
      end
    end
  end

  def track
    response.headers.delete('X-Frame-Options')
    render layout: false
  end

  private

  # if invalid category or product filters, return all stories
  def widget_html (params)
    filter_params = get_filters_from_query_or_widget(@company, params, true)
    stories = @company.filter_stories(filter_params)
      # if story.published?
      #   target_url = story.csp_story_url
      # elsif story.preview_published?
      #   target_url = root_url(subdomain: @company.subdomain) + "?preview=#{story.slug}"
      # elsif story.logo_published?
      #   target_url = 'javascript:;'
      # end
      # {
      #   title: story.title,
      #   customer: story.customer.name,
      #   logo: story.customer.logo_url,
      #   url: target_url,
      #   published: story.published?,
      #   preview_published: story.preview_published?,
      #   updated_at: story.updated_at
      # }
    if @company.subdomain == 'varmour'
      # ref: https://stackoverflow.com/questions/33732208
      stories = stories.sort_by { |s| [ !s[:published] ? 0 : 1, s[:updated_at] ] }.reverse
    end
    case params[:type]
    when 'carousel'
      partial = 'stories_carousel'
    when 'fixed-carousel'
      partial = 'stories_fixed_carousel'
    # when 'gallery'
    #   partial = 'stories_gallery'
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

end






