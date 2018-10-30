require 'stories_and_widgets'
class WidgetsController < ApplicationController
  include StoriesAndWidgets

  skip_before_action :verify_authenticity_token, only: [:main, :show, :init]
  before_action except: [:track] { @company = Company.find_by(subdomain: request.subdomain) }

  def main
    # handle legacy naming...
    if params[:type] == 'varmour'
      @type = 'carousel'
    elsif params[:type].blank? || params[:type] == 'tab'
      @type = 'tabbed_carousel'
    else
      @type = params[:type]
    end
    # set the stylesheet url here, as it's impossible to use the asset path helper in cs.js in a company-specific way
    @stylesheet_url = custom_stylesheet_url(@company, "cs_#{@type}")
    respond_to do |format|
      format.js { render action: 'cs' }
    end
  end

  def show
    respond_to do |format|
      format.js do
        json = { html: plugin_view(@company, params) }.to_json
        callback = params[:callback]
        jsonp = callback + "(" + json + ")"
        render(text: jsonp)
      end
    end
  end

  def init
    respond_to do |format|
      format.js { render action: params[:type] }
    end
  end

  def track
    response.headers.delete('X-Frame-Options')  # allows the tracking iframe to be rendered on host site
    render(layout: false)
  end

  def demo
    render(layout: false)
  end

  private

  # if invalid category or product filters, return all stories
  def plugin_view (company, params)
    # puts params.permit(params.keys).to_h
    stories = plugin_stories(company, params)
    render_to_string(
      partial: params[:type],
      layout: false,
      locals: {
        company: @company,
        # widget: @company.widget,   # applies to tabbed carousel (tab style)
        stories: stories.first(16),
        title: 'Customer Stories',
        is_demo: params[:is_demo].present?,
        background: params[:background],
        tab_color: params[:tab_color],
        text_color: params[:text_color],
        grayscale: params[:grayscale].present? && params[:grayscale] != 'false',
        logos_only: params[:logos_only].present? && params[:logos_only] != 'false',
        # max_stories: params[:max_stories].to_i,
        is_curator: false,
        is_plugin: true,
        is_external: true,
      }
    )
  end

  def plugin_stories (company, params)
    if params[:stories].present?
      # remove any that don't exist or aren't published, or if not authorized
      story_ids = params[:stories]
                   .delete_if { |story_id| !Story.exists?(story_id) }
                   .delete_if do |story_id|
                      story = Story.find(story_id)
                      (story.company.id != company.id) ||
                      !story.logo_published? ||
                      story.customer.logo_url.blank?
                    end
      stories = Story.where(id: story_ids).order_as_specified(id: story_ids)  # preserve original order
    elsif params[:category].present? || params[:product].present?
      filter_params = get_filters_from_query_or_plugin(company, params, true)
      stories = company.filter_stories(filter_params)
    else
      stories = company.public_stories
    end
    stories
  end

  def custom_stylesheet_url (company, type)
    URI.join(
      root_url,
      ActionController::Base.helpers.asset_path("custom/#{company.subdomain}/plugins/#{type}.css")
    ).to_s
  end

end






