# frozen_string_literal: true

class PluginsController < ApplicationController
  skip_before_action :verify_authenticity_token, only: %i[main show init]
  before_action(except: [:track]) { @company = Company.find_by(subdomain: request.subdomain) }

  def main
    @type = params[:type] || 'tabbed_carousel' # trunity still using old tabbed carousel
    @uid = params[:uid]

    # set the stylesheet url here, as it's impossible to use the asset path helper in cs.js in a company-specific way
    @stylesheet_url = if helpers.custom_stylesheet?(@company, 'plugins')
                        helpers.asset_url("custom/#{@company.subdomain}/plugins.css").to_s
                      else
                        helpers.asset_url('plugins/main.css').to_s
                      end
    respond_to { |format| format.js { render action: 'cs' } }
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
        json = { html: plugin_view(@company) }.to_json
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
    response.headers.delete('X-Frame-Options') # allows the tracking iframe to be rendered on host site
    render(layout: false)
  end

  def demo
    @plugin = plugin_params.to_h
    @category_slug = StoryCategory.find_by_id(@plugin[:category])&.slug
    @product_slug = Product.find_by_id(@plugin[:product])&.slug
    render(layout: false)
  end

  private

  def plugin_params
    params.require(:plugin).permit(
      :type, :category, :product, :grayscale, :logos_only, stories: [], gallery: {}, carousel: {}, tabbed_carousel: {}
    )
  end

  def plugin_view(company)
    preselected_story = get_preselected_story(company)
    render_to_string(
      partial: params[:type] || 'tabbed_carousel',
      layout: false,
      locals: {
        company:,
        stories: featured_stories(company).first(40), # limit stories for performance
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
        is_external: request.referer !~ %r{^(?!.*plugins/demo).*(lvh\.me|ryanwilson\.dev|customerstories\.net).*$},
        window_width: params[:window_width],
        preselected_story_id: preselected_story&.id
      }
    )
  end

  def get_preselected_story(company)
    story = (
      params[:preselected_story].present? and
      Story.friendly.exists?(params[:preselected_story]) and
      Story.friendly.find(params[:preselected_story])
    ) || nil
    return unless (story&.company&.id == company.id) && (story&.published? || story&.preview_published?)

    story.video = story.video_info
    story
  end

  def featured_stories(company)
    if params[:stories].present?
      story_ids = params[:stories].map(&:to_i).keep_if { |story_id| story_id.in? company.stories.featured.map(&:id) }
      stories = Story.where(id: story_ids).order_as_specified(id: story_ids) # preserve custom order
    elsif params[:category].present? || params[:product].present?
      stories = company.stories.featured.filtered story_filters_from_params(company)
    else
      stories = company.stories.featured
    end
    params[:skip].present? ? stories.where.not(slug: params[:skip]) : stories
  end
end
