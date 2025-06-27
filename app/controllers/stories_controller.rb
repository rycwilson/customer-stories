# frozen_string_literal: true

class StoriesController < ApplicationController
  before_action :set_company

  # jsonp request for plugins
  skip_before_action(:verify_authenticity_token, only: [:show], if: proc { params[:is_plugin] })

  def index
    @v2 = params[:v2].present?
    @is_dashboard = turbo_frame_request?
    @filters = story_filters_from_params(@company, is_dashboard: @is_dashboard)
    @filters_match_type = cookies["csp-#{'dashboard-' if @is_dashboard}filters-match-type"] || 'all'
    if @is_dashboard
      # @filters[:curator] ||= current_user.id
      @stories = if params[:q].present?
                   search(@company.stories, params[:q])
                 else
                   Story.default_order @company.stories.filtered(@filters, @filters_match_type)
                 end
    else
      # set_or_redirect_to_story_preview(params[:preview], session[:preview_story_slug])
      @featured_stories =
        @company.stories.featured.order([published: :desc, preview_published: :desc, updated_at: :desc])
      if request.xhr? && params[:q].present?
        respond_to do |format|
          format.json { render(json: search(@featured_stories, params[:q]).pluck(:id).uniq) }
        end
        return
      elsif @filters.present?
        @filtered_story_ids = @featured_stories.filtered(@filters, @filters_match_type).pluck(:id)
      end
    end
    render(@v2 ? 'index2' : 'index', layout: @is_dashboard ? false : 'stories')
  end

  # GET new_success_story / new_company_story
  def new
    @success = @company.successes.find_by(id: params[:success_id]) # success_id may or may not be present
    @story = @success.present? ? @success.build_story : Story.new
  end

  def show
    set_public_story_or_redirect(@company)
    @is_social_share_redirect = true if params[:redirect_uri].present?
    # response.set_header('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate, private')
    @story.video = @story.video_info

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
    @story.video = @story.video_info
    @workflow_stage = 'story'
    @active_tab = cookies['csp-edit-story-tab'] || '#story-narrative-content'

    # if request.path != curate_story_path(@story.customer.slug, @story.slug) # friendly path changed
    #   # old story title slug requested, redirect to current
    #   return redirect_to(
    #     curate_story_path(@story.customer.slug, @story.slug),
    #     status: :moved_permanently
    #   )
    # end

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
      # @story_views_30_day_count = page_views.since(30.days.ago).count

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
      redirect_to edit_story_path(@story), status: :see_other, notice: 'Story was created successfully.'
    else
      # flash.now[:alert] = "There were some errors"
      @errors = @story.errors.full_messages
      render(:new, status: :unprocessable_entity)
    end
  end

  def update
    # puts 'stories#update'
    # awesome_print(story_params.to_h)
    @story = Story.friendly.find(params[:id])

    # the video url in standardized format is sent in a hidden field
    params[:story][:video_url] = params[:story][:formatted_video_url] if params[:story][:video_url]
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
          # 's3DirectPostFields' => @story.previous_changes[:og_image_url] && set_s3_direct_post.fields,
          @res_data = {
            'story' => @story.as_json({
                                        only: %i[id title slug logo_published preview_published published],
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
            'storyWasPublished' => @story.previous_changes[:published].try(:[], 1) && 'Story published',
            'previewStateChanged' => (@story.previous_changes[:logo_published].try(:[], 1) && 'Logo published') ||
                                     (@story.previous_changes[:logo_published].try(:[], 0) && 'Logo unpublished') ||
                                     (@story.previous_changes[:preview_published].try(:[], 1) && 'Preview published') ||
                                     (@story.previous_changes[:preview_published].try(:[], 0) && 'Preview unpublished'),
            'publishStateChanged' => (@story.previous_changes[:published].try(:[], 1) && 'Story published') ||
                                     (@story.previous_changes[:published].try(:[], 0) && 'Story unpublished')
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
    @story = Story.friendly.find params[:id]
    @story.destroy
    respond_to(&:js)
  end

  def track
    response.headers.delete('X-Frame-Options') # allows the tracking iframe to be rendered on host site
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
        :id, :name, :placeholder, :customer_id, :curator_id,
        { product_ids: [], story_category_ids: [],
          customer_attributes: %i[id name logo_url show_name_with_logo company_id] }
      ],
      results_attributes: %i[id description _destroy],
      topic_ad_attributes: %i[id adwords_ad_group_id ad_id status _destroy],
      retarget_ad_attributes: %i[id adwords_ad_group_id ad_id status _destroy]
    )
  end

  def search(stories, query)
    q = Story.sanitize_sql_like(query.strip.downcase)
    results =
      stories.where('LOWER(title) LIKE ? OR LOWER(narrative) LIKE ?', "%#{q}%", "%#{q}%") +
      stories.joins(:customer).where('LOWER(customers.name) LIKE ?', "%#{q}%") +
      stories.joins(:category_tags, :product_tags)
             .where('LOWER(story_categories.name) LIKE ? OR LOWER(products.name) LIKE ?', "%#{q}%", "%#{q}%") +
      stories.joins(:results).where('LOWER(results.description) LIKE ?', "%#{q}%")
    results.uniq
  end

  def new_ads(story, story_params)
    [story_params[:topic_ad_attributes], story_params[:retarget_ad_attributes]]
      .all? { |ad_attrs| ad_attrs.present? && ad_attrs[:id].blank? } &&
      {
        topic: AdwordsAd.joins(:adwords_campaign)
                        .where(adwords_campaigns: { type: 'TopicCampaign' }, story_id: story.id)
                        .take.try(:slice, :id, :ad_id),
        retarget: AdwordsAd.joins(:adwords_campaign)
                           .where(adwords_campaigns: { type: 'RetargetCampaign' }, story_id: story.id)
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
      story.ads.all? { |ad| ad.ad_id.present? } ? false : true

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

  def set_or_redirect_to_story_preview(params_story_slug, session_story_slug)
    should_redirect = params_story_slug
    was_redirected = session_story_slug
    if should_redirect
      session[:preview_story_slug] = params_story_slug
      redirect_to(root_url(subdomain: @company.subdomain))
    elsif was_redirected
      story = Story.friendly.exists?(session_story_slug) && Story.friendly.find(session_story_slug)
      # gon.push({ preview_story: story.id }) if story&.preview_published?
      session.delete(:preview_story_slug)
    end
  end

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

  # Request satisfied the StoryPathConstraint (story is not nil):
  # /:customer/:product/:title OR /:customer/:title OR /:random_string
  def set_public_story_or_redirect(company)
    @story = Story.find_by(hidden_link: request.url) || Story.friendly.find(params[:title])
    if params[:hidden_link]
      redirect_to(@story.csp_story_path, status: :moved_permanently) if @story.published?
    elsif request.path != @story.csp_story_path # friendly path changed
      redirect_to(@story.csp_story_path, status: :moved_permanently)
    elsif params[:is_plugin]
      @story
    elsif !@story.published? && !company.curators.include?(current_user)
      redirect_to root_url(subdomain: request.subdomain, host: request.domain)
    end
  end
end
