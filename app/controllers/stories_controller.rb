require 'stories_and_plugins'
class StoriesController < ApplicationController
  include StoriesHelper
  include StoriesAndPlugins

  # jsonp request for plugins
  skip_before_action(:verify_authenticity_token, only: [:show], if: Proc.new { params[:is_plugin] })

  before_action :set_company
  # before_action :set_story, only: [:edit, :ctas, :tags, :promote, :destroy]
  before_action only: [:show] do
    @is_social_share_redirect = true if params[:redirect_uri].present?
    @is_curator = @company.curator?(current_user)
  end
  before_action(only: [:show]) { set_public_story_or_redirect(@company) }
  before_action :set_s3_direct_post, only: :edit

  def index
    @is_dashboard = turbo_frame_request? || params[:promoted].present?
    unless params[:promoted].present?
      @filters = set_filters(params) 
      @filters_match_type = cookies["csp-#{'dashboard-' if @is_dashboard}filters-match-type"] || 'all'
    end
    if @is_dashboard
      # @filters[:curator] ||= current_user.id
      if params[:promoted].present?
        respond_to { |format| format.json { render(json: promoted_stories_json) } } and return
      end
      @stories = params[:q].present? ?
        search(@company.stories, params[:q]) : 
        Story.default_order(@company.stories.filtered(@filters, @filters_match_type))
    else
      # set_or_redirect_to_story_preview(params[:preview], session[:preview_story_slug])
      # @tags_filter = get_filters_from_query_or_plugin(@company, params)
      @featured_stories = @company.stories.featured.order([published: :desc, preview_published: :desc, updated_at: :desc])
      if request.xhr? and params[:q].present?
        respond_to do |format| 
          format.json { render(json: search(@featured_stories, params[:q]).pluck(:id).uniq) }
        end and return
      elsif (@tags = @filters.slice(:category, :product)).present?
        @filtered_story_ids = @featured_stories.filtered(@tags, @filters_match_type).pluck(:id)
      end
    end
    render(layout: @is_dashboard ? false : 'stories')
  end

  def new
    @success = @company.successes.find_by(id: params[:success_id])  # success_id may or may not be present
    @story = @success.present? ? @success.build_story : Story.new
  end

  def show
    sleep 3 if params[:sleep]
    # response.set_header('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate, private')
    @story.video = @story.video_info()

    if params[:is_plugin]
      # @is_plugin = @is_external = true
      respond_to do |format|
        format.js do
          json = { html: render_story_partial_to_string(@story, params[:window_width]) }.to_json
          jsonp = "#{params[:callback]}(#{json})"
          render(plain: jsonp)
        end
      end and return
    end

    @is_preview = params[:preview].present?
    # convert the story narrative to plain text (for SEO tags)
    # @story_narrative = HtmlToPlainText.plain_text(@story.narrative)
    @related_stories = @story.related_stories
    @more_stories = @company.public_stories
    render(layout: 'stories')
  end

  def edit
    # @story = Story.find_by_id(params[:id]) || Story.friendly.find(params[:story_slug])
    @story = Story.friendly.find(params[:id])
    @story.video = @story.video_info()
    @workflow_stage = 'story'
    @active_tab = cookies['csp-edit-story-tab'] || '#story-narrative-content'
    
    # if request.path != curate_story_path(@story.customer.slug, @story.slug) # friendly path changed
    #   # old story title slug requested, redirect to current
    #   return redirect_to(
    #     curate_story_path(@story.customer.slug, @story.slug), 
    #     status: :moved_permanently
    #   )
    # end
    # user_authorized?(@story, current_user)

    if params[:edit_story_partial]
      respond_to do |format|
        format.html do
          render(
            partial: 'stories/edit/edit',
            locals: { company: @company, story: @story, workflow_stage: 'curate', tab: '#story-settings' }
          )
        end
      end

    elsif params[:contributions]
      respond_to do |format|
        format.js { render(action: 'edit/content/contributions') }
        # format.json do
        #   render({
        #     json: {
        #       invitation_templates: JSON.parse(
        #         @story.success.invitation_templates.to_json({ only: [:id, :name] })
        #       ),
        #       questions: JSON.parse(
        #         @story.success.questions.distinct.to_json({ only: [:id, :question] })
        #       ),
        #       answers: JSON.parse(
        #         @story.success.answers.to_json({ only: [:answer, :contribution_id, :contributor_question_id] })
        #       )
        #     }.to_json
        #   })
        # end
      end

    elsif false
      # provide data for both stories#edit and companies#show views
      @customer = @story.success.customer

      # measure
      # @recent_activity = @company.recent_activity(30)
      # @story_views_30_day_count = PageView.joins(:visitor_session).company_story_views_since(@company.id, 30).count

      # @workflow_stage = 'curate'
      # @curate_view = 'story'  # instead of 'stories'
      @edit_story_tab = request.cookies['csp-edit-story-tab'] || '#story-settings'
      @workflow_stage = 'story'
      # render('companies/show')
      render(layout: 'application')
    end

    # since a stories layout exists and will be used here by default,
    # must explicitly specify application layout and layout: false for turbo frame requests
    render(layout: turbo_frame_request? ? false : 'application')
  end

  def create
    @story = Story.new(story_params)
    if @story.save
      @redirect_path = edit_story_path(story)
    end
    respond_to { |format| format.js }
  end

  def update
    # puts 'stories#update'
    # awesome_print(story_params.to_h)
    @story = Story.friendly.find(params[:id])
    
    # the video url in standardized format is sent in a hidden field
    if params[:story][:video_url]
      params[:story][:video_url] = params[:story][:formatted_video_url]
    end
    @story.update(story_params)
    redirect_to edit_story_path(@story) and return
    
    # @story = Story.find_by_id params[:id]
    if params[:settings]
      @story.success.cta_ids = params[:ctas]
      if @story.update(story_params)
        # TODO: a better way of handling google errors
        # => only way to get errors back from the associated ad is to validate it,
        #    but present scheme dictates that the ad exists even if it has no ad_id
        #    (and that's how it would be validated: presence of ad_id)
        # => adding errors to self.story.errors[:base] doesn't seem to work
        # => if all companies push to google regardless of promote_tr?,
        #     model validations can be made easier by checking for AdwordsAd.ad_id on create
      else
      end
      respond_to do |format|
        format.js do
          @res_data = {
            'story' => @story.as_json({
              only: [:id, :title, :slug, :logo_published, :preview_published, :published],
              methods: [:csp_story_path],
              include: {
                success: {
                  only: [],
                  include: {
                    customer: { only: [:name] }
                  }
                }
              }
            }),
            'storyErrors' => @story.errors.full_messages,
            's3DirectPostFields' => @story.previous_changes[:og_image_url] && set_s3_direct_post().fields,
            'storyWasPublished' => (@story.previous_changes[:published].try(:[], 1) && 'Story published'),
            'previewStateChanged' => (
              (@story.previous_changes[:logo_published].try(:[], 1) && 'Logo published') ||
              (@story.previous_changes[:logo_published].try(:[], 0) && 'Logo unpublished') || 
              (@story.previous_changes[:preview_published].try(:[], 1) && 'Preview published') ||
              (@story.previous_changes[:preview_published].try(:[], 0) && 'Preview unpublished')
            ),
            'publishStateChanged' => (
              (@story.previous_changes[:published].try(:[], 1) && 'Story published') ||
              (@story.previous_changes[:published].try(:[], 0) && 'Story unpublished')
            )
            # 'promoteEnabled' => @story.company.promote_tr?,
            # 'newAds' => new_ads(@story, story_params.to_h),
            # 'gadsWereCreated' => gads_were_created?(@story, story_params.to_h),
            # 'gadsErrors' => gads_errors?(@story, story_params.to_h),
            # 'adsWereDestroyed' => ads_were_destroyed?(story_params.to_h),
            # 'gadsWereRemoved' => gads_were_removed?(@story, story_params.to_h),
          }
          render({ action: 'edit/settings/update' })
        end
      end

    elsif params[:story][:form] == 'content'
      # the video url in standardized format is sent in a hidden field
      params[:story][:video_url] = params[:story][:formatted_video_url]
      @story.update(story_params)
      respond_to do |format|
        format.js { render({ action: 'edit/content/update' }) }
      end
    end
  end

  

  def destroy
    @story.destroy
    respond_to { |format| format.js }
  end

  def track
    response.headers.delete('X-Frame-Options')  # allows the tracking iframe to be rendered on host site
    render(layout: false)
  end

  private

  def story_params
    params.require(:story).permit(
      :title, :summary, :quote, :quote_attr_name, :quote_attr_title, :video_url, :success_id,
      :formatted_video_url, :narrative, :published, :logo_published, :preview_published,
      :hidden_link, :og_title, :og_description, :og_image_url, :og_image_width, :og_image_height,
      :og_image_alt,
      success_attributes: [
        :id, :name, :customer_id, :curator_id,
        product_ids: [], story_category_ids: [],
        customer_attributes: [:id, :name, :logo_url, :show_name_with_logo, :company_id]
      ],
      results_attributes: [:id, :description, :_destroy],
      topic_ad_attributes: [:id, :adwords_ad_group_id, :ad_id, :status, :_destroy],
      retarget_ad_attributes: [:id, :adwords_ad_group_id, :ad_id, :status, :_destroy]
    )
  end

  def search stories, q
    results = stories.content_like(q) + stories.customer_like(q) + stories.tags_like(q) + stories.results_like(q)
    results.uniq
  end

  def set_filters params
    %i(curator status customer category product).map do |type| 
      if params[type].blank?
        [type, nil]
      elsif @is_dashboard
        [type, params[type]&.to_i]
      else
        case type
        when :category; [type, StoryCategory.friendly.find(params[type])&.id]
        when :product; [type, Product.friendly.find(params[type])&.id]
        else [type, nil]   # public stories don't have curator, status, or customer filters
        end
      end
    end.to_h.compact
  end

  def promoted_stories_json
    @company.stories.with_ads.to_json({
      only: [:id, :title, :slug],
      methods: [:ads_status, :ads_long_headline, :ads_images, :csp_story_path, :edit_ad_images_path],
      include: {
        success: {
          only: [:curator_id],
          include: {
            customer: { only: [:name, :slug] }
          }
        },
        topic_ad: {
          only: [:id, :status]
        },
        retarget_ad: {
          only: [:id, :status]
        }
      }
    })
  end

  def new_ads(story, story_params)
    [ story_params[:topic_ad_attributes], story_params[:retarget_ad_attributes] ]
      .all? { |ad_attrs| ad_attrs.present? && ad_attrs[:id].blank? } &&
    {
      topic: AdwordsAd.joins(:adwords_campaign)
                      .where(adwords_campaigns: { type: 'TopicCampaign'}, story_id: story.id)
                      .take.try(:slice, :id, :ad_id),
      retarget: AdwordsAd.joins(:adwords_campaign)
                         .where(adwords_campaigns: { type: 'RetargetCampaign'}, story_id: story.id)
                         .take.try(:slice, :id, :ad_id)
    }
  end

  def ads_were_destroyed?(story_params)
    story_params.any? do |param, value|
      param.match(/ad_attributes/) && value.try(:[], :_destroy) == 'true'
    end
  end

  # checking for successfully created ads is easy: just look for the ad_id
  def gads_were_created?(story, story_params)
    new_ads = new_ads(story, story_params)
    new_ads.present? &&
    new_ads.all? { |campaign_type, ad_data| ad_data.try(:[], :ad_id).present? }
  end

  # checking for successfully removed ads is a bit different:
  # => ads are destroyed whether or not company.promote_tr?, so check for that
  def gads_were_removed?(story, story_params)
    story.company.promote_tr? &&
    ads_were_destroyed?(story_params.to_h) &&
    !gads_errors?(story, story_params.to_h)
  end

  def gads_errors?(story, story_params)
    return false unless story.company.promote_tr?
    if story.was_published?
      return story.ads.all? { |ad| ad.ad_id.present? } ? false : true

    # check if the ads still exist on google
    # => this won't work if the ad_id is bad
    elsif story.was_unpublished?
      # return [
      #          story_params[:topic_ad_attributes].try(:[], :ad_id),
      #          story_params[:retarget_ad_attributes].try(:[], :ad_id)
      #        ]
      #          .any? { |ad_id| ad_id.present? ? GoogleAds::get_ad(ad_id) : false }
    end
  end

  def set_company
    @company = (
      Company.find_by(id: params[:company_id]) || 
      Company.find_by(subdomain: params[:company_id]) ||
      Company.find_by(subdomain: request.subdomain)
    )
  end

  def set_or_redirect_to_story_preview(params_story_slug, session_story_slug)
    should_redirect = params_story_slug
    was_redirected = session_story_slug
    if should_redirect
      session[:preview_story_slug] = params_story_slug
      redirect_to(root_url(subdomain: @company.subdomain))
    elsif was_redirected
      story = Story.friendly.exists?(session_story_slug) && Story.friendly.find(session_story_slug)
      gon.push({ preview_story: story.id }) if (story && story.preview_published?)
      session.delete(:preview_story_slug)
    end
  end

  # def set_story
  #   @story = Story.find_by_id(params[:id]) || Story.friendly.find(params[:story_slug])
  # end

  def render_story_partial_to_string(story, window_width)
    render_to_string({
      partial: "stories/show/#{story.published? ? 'story' : 'preview'}",
      locals: {
        company: story.company,
        story: story,
        has_video: story.video[:thumbnail_url].present?,
        related_stories: nil,
        is_plugin: true,
        window_width: window_width
      }
    })
  end

  # new customers can be created on new story creation
  # the customer field's value will be either a number (db id of existing customer),
  # or a string (new customer)
  # this method ensures that a number is treated as a number and a string is
  # treated as a string, e.g. "3M" is treated as a string
  def new_customer? (customer)
    !Float(customer)  # if a number then customer already exists -> return false
    rescue ArgumentError  # if error then customer is a string -> return true
      true
  end

  # if we're here, it means the router allowed through a valid path:
  # /:customer/:product/:title OR /:customer/:title OR /:customer/:random_string
  # (valid => these resources exist AND exist together)
  # => @story can't be nil
  #
  # method will set the public story if published or if curator,
  # else it will redirect to ...
  #   - the correct link if outdated slug is used
  #   - company's story index if not published or not curator
  def set_public_story_or_redirect company
    @story = Story.find_by(hidden_link: request.url) || Story.friendly.find(params[:title])
    if params[:hidden_link].present? 
      if @story.published?
        redirect_to(@story.csp_story_path, status: :moved_permanently) and return
      end
    elsif request.path != @story.csp_story_path  # friendly path changed
      redirect_to(@story.csp_story_path, status: :moved_permanently) and return
    elsif request.format == 'application/pdf' || params[:is_plugin]
      @story
    elsif not @story.published? and not company.curators.include?(current_user)
      redirect_to(root_url(subdomain:request.subdomain, host:request.domain)) and return
    end
  end

  def user_authorized? story, current_user
    if current_user.try(:company_id) == story.success.customer.company.id
      true
    else
      render file: 'public/403', status: 403, layout: false
      false
    end
  end

  # async filter requests may contain either the tag's numeric id or its slug
  # if id, look up the slug and return.  if slug, just return
  def get_filter_slug filter_params
    if filter_params[:id] == '0'  # all -> query string to be removed, no slug needed
      return nil
    elsif filter_params[:id].to_i == 0  # params already contain slug (instead of numeric id)
      filter_params[:id]
    elsif filter_params[:tag] == 'category'
      StoryCategory.find(filter_params[:id]).slug
    elsif filter_params[:tag] == 'product'
      Product.find(filter_params[:id]).slug
    else
      # error
    end
  end
end
