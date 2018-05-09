require 'stories_and_widgets'
class StoriesController < ApplicationController
  include StoriesHelper
  include StoriesAndWidgets

  before_action :set_company
  before_action :set_story, only: [:edit, :update, :ctas, :tags, :promote, :approval, :destroy]
  before_action only: [:show] { @is_curator = @company.curator?(current_user) }
  before_action only: [:edit] { user_authorized?(@story, current_user) }
  before_action only: [:index, :show, :edit] { set_gon(@company) }
  before_action only: [:show] { set_public_story_or_redirect(@company) }
  before_action only: [:show, :approval] { set_contributors(@story) }
  before_action :set_s3_direct_post, only: :edit

  def index
    # these instance variables will get overwritten below if there's a query filter
    @pre_selected_filters = { category: '', product: '' }
    @stories_index_cache_key = @company.stories_index_cache_key(@pre_selected_filters)
    @category_select_cache_key = @company.category_select_cache_key(0)
    @product_select_cache_key = @company.product_select_cache_key(0)

    # from widget clicks on a preview-published story
    if params[:preview].present?
      session[:preview_story_slug] = params[:preview]
      redirect_to(root_url(subdomain: @company.subdomain))
    elsif session[:preview_story_slug].present?
      story = Story.friendly.exists?(session[:preview_story_slug]) &&
              Story.friendly.find(session[:preview_story_slug])
      if story && story.preview_published?
        gon.push({ preview_story: story.id })
        session.delete(:preview_story_slug)
      end
    end
    if (filter_params = get_filters_from_query_or_widget(@company, params))
      # ?category=automotive  =>  { tag: 'category', id: '42' }
      @stories_index_cache_key = @company.stories_index_cache_key(filter_params)
      unless fragment_exist?(@stories_index_cache_key)
        @stories = @company.filter_stories(filter_params)
      end
      @pre_selected_filters = filter_params
      puts "PRE_SELECTED"
      puts @pre_selected_filters
      if filter_params[:category].present?
        @category_select_cache_key = @company.category_select_cache_key(filter_params[:category])
      elsif filter_params[:product].present?
        @product_select_cache_key = @company.product_select_cache_key(filter_params[:product])
      end
    else
      unless fragment_exist?(@stories_index_cache_key)
        public_story_ids = @company.public_stories
        # sort order is lost when .find takes an array of ids, so need to re-sort;
        # ref: http://stackoverflow.com/questions/1680627
        @stories = Story.find(public_story_ids)
                        .sort_by { |story| public_story_ids.index(story.id) }
      end
    end
  end

  def show
    if params[:remove_video].present?
      if params[:xs_screen]
        render({
          partial: 'stories/show/video_xs',
          locals: { story: @story, include_video: false }
        })
      else
        render({
          partial: 'stories/show/testimonial',
          locals: { story: @story, include_video: false }
        })
      end
    end
    # convert the story content to plain text (for SEO tags)
    @story_content_text = HtmlToPlainText.plain_text(@story.content)
    @related_stories = @story.related_stories
    @more_stories = Story.find(@company.public_stories)
        .delete_if { |story| story.id == @story.id || story.customer.logo_url.blank? }
        .map do |story|
          {
            title: story.title,
            logo: story.customer.logo_url,
            path: story.published ? story.csp_story_path : root_path,
            published: story.published
          }
        end
  end

  def edit
    # want to catch an ajax request for _edit partial, but ignore tubolinks ajax requests
    if request.xhr? && !request.env["HTTP_TURBOLINKS_REFERRER"]
      render({
        partial: 'stories/edit/edit',
        locals: {
          company: @company,
          story: @story,
          workflow_stage: 'curate',
          tab: '#story-settings'
        }
      })
    else
      # provide data for both stories#edit and companies#show views
      @customer = @story.success.customer
      @referrer_select = @story.success.contributions
                               .map { |c| [ c.contributor.full_name, c.contributor.id ] }
                               .unshift( [""] )
      # measure
      @recent_activity = Rails.cache.fetch("#{@company.subdomain}/recent-activity") { @company.recent_activity(30) }
      @story_views_30_day_count = PageView.joins(:visitor_session)
                                    .company_story_views_since(@company.id, 30).count
      @workflow_stage = 'curate'
      @curate_view = 'story'  # instead of 'stories'
      @curate_story_tab = cookies['csp-story-tab']
      render('companies/show')
    end
  end

  def create
    # pp(story_params)
    @story = Story.new(story_params)
    if @story.save
      @redirect_path = curate_story_path(@story.customer.slug, @story.slug)
    end

    respond_to { |format| format.js }
  end

  def update
    if params[:settings]
      # pp params
      @story.success.cta_ids = params[:ctas]
      @story.update(story_params)
      # html response necessary for uploading customer logo image
      respond_to do |format|
        format.html do
          redirect_to(
            curate_story_path(@story.customer.slug, @story.slug, tab: 'settings'),
            flash: { success: "Story Settings updated" }
          )
        end
        format.js { render({ action: 'edit/settings/update' }) }
      end
    elsif params[:story][:form] == 'content'
      # the video url in standardized format is sent in a hidden field
      params[:story][:video_url] = params[:story][:formatted_video_url]
      @story.update(story_params)
      respond_to { |format| format.js { render({ action: 'edit/content/update' }) } }
    end
  end

  def promoted
    respond_to() do |format|
      format.json do
        render({
          json: @company.stories.with_ads.to_json({
                  only: [:id, :title, :slug],
                  methods: [:ads_status, :ads_long_headline, :ads_image_url, :csp_story_path],
                  include: {
                    success: {
                      only: [],
                      include: {
                        customer: { only: [:name, :slug] },
                      }
                    }
                  }
                })

        })
      end
    end
  end

  def destroy
    @story.expire_cache_on_destroy
    @story.destroy
    respond_to { |format| format.js }
  end

  def search
    @story_ids = Story.joins(:customer)
                      .where(customers: { company_id: @company.id })
                      .where("logo_published = TRUE OR preview_published = TRUE")
                      .where(
                         "title LIKE ? OR content LIKE ?",
                         "%#{params[:search_string]}%", "%#{params[:search_string]}%"
                       )
                      .map { |s| s.id }
    Customer.where("company_id = ? AND name LIKE ?", @company.id, "%#{params[:search_string]}%")
            .each { |customer| @story_ids.concat(customer.story_ids) }
    StoryCategory.where("company_id = ? AND name LIKE ?", @company.id, "%#{params[:search_string]}%")
                 .each { |tag| @story_ids.concat(tag.story_ids) }
    Product.where("company_id = ? AND name LIKE ?", @company.id, "%#{params[:search_string]}%")
           .each { |tag| @story_ids.concat(tag.story_ids) }
    @story_ids.uniq!
    respond_to { |format| format.js {} }
  end

  ##
  ##  this action is a catch-all for promote changes related to a given story
  ##  - create ads for a story (POST)
  ##  - modify ads for a story (PUT)
  ##  - remove ads for a story (DELETE)
  ##
  def promote
    response = {}  # this will be necessary if ads for an unpublished story are removed
    if request.method == 'POST'
      @company.create_shell_campaigns if @company.campaigns.empty?
      @story.ads.create({
        adwords_ad_group_id: @company.campaigns.topic.ad_group.id,
        long_headline: @story.title.truncate(ADWORDS_LONG_HEADLINE_CHAR_LIMIT, { omission: '' })
      })
      @story.ads.create({
        adwords_ad_group_id: @company.campaigns.retarget.ad_group.id,
        long_headline: @story.title.truncate(ADWORDS_LONG_HEADLINE_CHAR_LIMIT, { omission: '' })
      })
      @story.ads.adwords_image = @company.adwords_images.default
    elsif request.method == 'PUT'
      if params[:adwords_image_id].present?
        @story.ads.each { |ad| ad.adwords_image = AdwordsImage.find(params[:adwords_image_id]) }
      elsif @story.ads.all? { |ad| ad.update(adwords_params) }
        # nothing to do here
      else
        # errors
      end
      # this is the datatables data needed for a promoted story row (see promoted method above)
      dt_data = [
        JSON.parse(
          @story.to_json({
            only: [:id, :title, :slug],
            methods: [:ads_status, :ads_long_headline, :ads_image_url, :csp_story_path],
            include: {
              success: {
                only: [],
                include: {
                  customer: { only: [:name, :slug] }
                }
              }
            }
          })
        )
      ]
      respond_to do |format|
        format.json do
          render({ json: { data: dt_data }.to_json })
        end
      end and return
    elsif request.method == 'DELETE'  # js response
      if @story.ads.all? do |ad|
        ad.update(status:'REMOVED')
        # this must go in the delayed job queue, so it happens after ad.adwords_remove (already queued)
        ad.delay.destroy
      end
        flash.now[:notice] = 'Story unpublished and Promoted Story removed'
      else
        flash.now[:alert] = 'Error removing Promoted Story'
      end
    end
    respond_to do |format|
      # this works for all but long_headline:
      #   format.json { head :no_content }  (or head :ok)
      # but x-editable wants a json response with status 200
      format.json { render json: response, status: 200 }  # success
      # js response for removed ads
      format.js {}
    end
  end

  def approval
    respond_to do |format|
      format.pdf do
        render({
          pdf: "#{@company.subdomain}-customer-story-#{@story.customer.slug}",
          template: "stories/edit/approval.pdf.erb",
          locals: {
            story: @story,
            company: @company,
            customer_name: @story.customer.name,
            contributors: @contributors
          },
          footer: { right: '[page] of [topage]' }
        })
      end
    end
  end

  private

  def story_params
    params.require(:story)
      .permit(
        :title, :summary, :quote, :quote_attr_name, :quote_attr_title, :video_url, :success_id,
        :formatted_video_url, :content, :published, :logo_published, :preview_published,
        success_attributes: [
          :id, :name, :customer_id, :curator_id,
          product_ids: [], story_category_ids: [],
          results_attributes: [:id, :description, :_destroy] ,
          customer_attributes: [:id, :name, :logo_url, :company_id]
        ]
      )
  end

  def adwords_params
    params.require(:adwords).permit(:status, :long_headline)
  end

  def set_company
    if params[:company_id]  # create story
      @company = Company.find(params[:company_id])
    else
      @company = Company.find_by(subdomain: request.subdomain)
    end
  end

  def set_story
    @story = Story.find(params[:id])
  end

  def set_contributors story
    curator = story.success.curator
    @contributors =
        User.joins(own_contributions: { success: {} })
            .where.not(linkedin_url:'')
            .where(successes: { id: story.success_id },
                   contributions: { publish_contributor: true })
            .order("CASE contributions.role
                      WHEN 'customer' THEN '1'
                      WHEN 'customer success' THEN '2'
                      WHEN 'sales' THEN '3'
                    END")
            .to_a
            .delete_if { |c| c.id == curator.id } # remove the contributor;
                                                  # he goes at the end
    @contributors << curator unless curator.linkedin_url.blank?
    @contributors
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
  # /:customer/:product/:title OR /:customer/:title
  # (valid => these resources exist AND exist together)
  # => @story can't be nil
  #
  # method will set the public story if published or if curator,
  # else it will redirect to ...
  #   - the correct link if outdated slug is used
  #   - company's story index if not published or not curator
  def set_public_story_or_redirect company
    @story = Story.friendly.find params[:title]
    if request.format == 'application/pdf'
      @story
    elsif request.path != @story.csp_story_path  # friendly path changed
      # old story title slug requested, redirect to current
      return redirect_to @story.csp_story_path, status: :moved_permanently
    elsif !@story.published? && !company_curator?(company.id)
      return redirect_to root_url(subdomain:request.subdomain, host:request.domain)
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

  def remove_video? ()
    # request.xhr? &&  && params[:remove_video].present?
  end

end
