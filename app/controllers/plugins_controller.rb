require 'stories_and_plugins'
class PluginsController < ApplicationController
  include StoriesAndPlugins

  skip_before_action :verify_authenticity_token, only: [:main, :show, :init]
  before_action(except: [:track]) { @company = Company.find_by(subdomain: request.subdomain) }

  def main
    @type = params[:type] || 'tabbed_carousel'  # trunity still using old tabbed carousel
    @uid = params[:uid]

    # set the stylesheet url here, as it's impossible to use the asset path helper in cs.js in a company-specific way
    @stylesheet_url = helpers.asset_url("custom/plugin_wrappers/#{@company.subdomain}_plugins.css").to_s
    respond_to do |format|
      format.js { render action: 'cs' }
    end
  end

  def show
    # DEPRECATION WARNING: `render :text` is deprecated because it does not actually render a `text/plain` response.
    # Switch to `render plain: 'plain text'` to render as `text/plain`, `render html: '<strong>HTML</strong>'` to render as `text/html`,
    # or `render body: 'raw'` to match the deprecated behavior and render with the default Content-Type, which is `text/plain`.
    # (called from block (2 levels) in show at /Users/wilson/dev/csp/app/controllers/plugins_controller.rb:34)
    respond_to do |format|
      format.js do
        json = { html: plugin_view(@company, params) }.to_json
        callback = params[:callback]
        jsonp = callback + "(" + json + ")"
        # render(text: jsonp)
        render(plain: jsonp)
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
    pre_selected_story = get_pre_selected_story(company, params)
    render_to_string(
      partial: params[:type] || 'tabbed_carousel',
      layout: false,
      locals: {
        company: company,
        stories: stories,  #.first(16),
        title: params[:title] || 'Customer Stories',
        is_demo: params[:is_demo].present?,
        max_rows: params[:max_rows].to_i,
        background: params[:background] || 'light',
        tab_color: params[:tab_color],
        text_color: params[:text_color],
        carousel_version: company.subdomain == 'pixlee' ? 'v2' : 'v1',
        logo_style: params[:logo_style],
        is_grayscale: params[:grayscale].present? && params[:grayscale] != 'false',
        is_curator: false,
        is_plugin: true,
        is_external: request.referer.match(/^(?!.*plugins\/demo).*(lvh\.me|customerstories\.org|customerstories\.net).*$/) ?
                       false :
                       true,
        window_width: params[:window_width],
        pre_selected_story_id: pre_selected_story.try(:id),
        contributors: pre_selected_story && set_contributors(pre_selected_story)
      }
    )
  end

  def get_pre_selected_story(company, params)
    story = params[:pre_selected_story].present? &&
            Story.friendly.exists?(params[:pre_selected_story]) &&
            Story.friendly.find(params[:pre_selected_story])
    return story.try(:company).try(:id) == company.id &&
      ( story.try(:published?) || story.try(:preview_published?) ) &&
      story
  end

  def plugin_stories(company, params)
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
    params[:skip].present? ? stories.where.not(slug: params[:skip]) : stories
  end

end






