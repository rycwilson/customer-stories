require 'stories_and_plugins'
class PluginsController < ApplicationController
  include StoriesAndPlugins

  skip_before_action :verify_authenticity_token, only: [:main, :show, :init]
  before_action(except: [:track]) { @company = Company.find_by(subdomain: request.subdomain) }

  def main
    @type = params[:type] || 'tabbed_carousel'  # trunity still using old tabbed carousel
    @uid = params[:uid]

    # set the stylesheet url here, as it's impossible to use the asset path helper in cs.js in a company-specific way
    @stylesheet_url = helpers.custom_stylesheet?(@company, 'plugins') ?
      helpers.asset_url("custom/#{@company.subdomain}/plugins.css").to_s :
      helpers.asset_url('plugins.css').to_s
      
    respond_to do |format|
      format.js { render action: 'cs' }
    end
  end

  def show
    respond_to do |format|
      # format.json {
      #   render json: {
      #     is_demo: params[:is_demo],
      #     stories: JSON.parse(params[:stories]),
      #   }
      # }
      format.js do
        json = { html: plugin_view(@company, params) }.to_json
        jsonp = "#{params[:callback]}(#{json})"

        # DEPRECATION WARNING: `render :text` is deprecated because it does not actually render a `text/plain` response.
        # Switch to `render plain: 'plain text'` to render as `text/plain`, `render html: '<strong>HTML</strong>'` to render as `text/html`,
        # or `render body: 'raw'` to match the deprecated behavior and render with the default Content-Type, which is `text/plain`.
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
    @plugin = plugin_params
    @category_slug = StoryCategory.find_by_id(@plugin[:category])&.slug
    @product_slug = StoryCategory.find_by_id(@plugin[:product])&.slug
    # awesome_print(@plugin)
    render(layout: false)
  end

  private

  def plugin_params
    params.require(:plugin).permit(
      :type, :category, :product, :grayscale, :logos_only, stories: [], gallery: {}, carousel: {}, tabbed_carousel: {}
    )
  end

  # if invalid category or product filters, return all stories
  def plugin_view (company, params)
    # puts params.permit(params.keys).to_h
    stories = plugin_stories(company, params)
    preselected_story = get_preselected_story(company, params)
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
        logos_only: params[:logos_only],
        is_grayscale: params[:grayscale].present? && params[:grayscale] != 'false',
        is_curator: false,
        is_plugin: true,
        is_external: !request.referer =~ /^(?!.*plugins\/demo).*(lvh\.me|customerstories\.org|customerstories\.net).*$/,
        window_width: params[:window_width],
        preselected_story_id: preselected_story&.id,
        contributors: preselected_story && set_contributors(preselected_story)
      }
    )
  end

  def get_preselected_story(company, params)
    story = (
      params[:preselected_story].present? &&
      Story.friendly.exists?(params[:preselected_story]) &&
      Story.friendly.find(params[:preselected_story])
    ) || nil
    if (story&.company&.id == company.id) && (story&.published? || story&.preview_published?)
      story.video = story.video_info()
      return story
    end
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






