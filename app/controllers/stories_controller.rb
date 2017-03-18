class StoriesController < ApplicationController

  include StoriesHelper

  before_action :set_company
  before_action :set_story, only: [:edit, :ctas, :tags, :approval, :destroy]
  before_action only: [:index, :show] { @is_curator = @company.curator?(current_user) }
  before_action only: [:edit] { user_authorized?(@story, current_user) }
  before_action only: [:index, :show, :edit] { set_gon(@company) }
  before_action only: [:show] { set_public_story_or_redirect(@company) }
  before_action only: [:show, :approval] { set_contributors(@story) }
  before_action :set_s3_direct_post, only: :edit

  def index
    # these will get overwritten below if there's a query filter ...
    @pre_selected_filter = { tag: 'all', id: 0 }
    @stories_index_cache_key =
      stories_index_cache_key(@company, @is_curator, @pre_selected_filter)
    @category_select_cache_key =
      filter_select_cache_key(
        @company, @is_curator, 'category', { tag: 'category', id: 0 })
    @product_select_cache_key =
      filter_select_cache_key(
        @company, @is_curator, 'product', { tag: 'product', id: 0 })

    if valid_query_string? params
      #  ?category=automotive  =>  { tag: 'category', id: '42' }
      filter_params = get_filter_params_from_query(params)
      @stories_index_cache_key =
        stories_index_cache_key(@company, @is_curator, filter_params)
      unless fragment_exist?(@stories_index_cache_key)
        @stories = @company.filter_stories_by_tag(filter_params, @is_curator)
      end
      @pre_selected_filter = filter_params # needed for options_for_select()
      @category_select_cache_key =
        filter_select_cache_key(@company, @is_curator, 'category', filter_params)
      @product_select_cache_key =
        filter_select_cache_key(@company, @is_curator, 'product', filter_params)

    elsif @is_curator
      unless fragment_exist?(@stories_index_cache_key)
        story_ids = @company.all_stories
        @stories = Story.find(story_ids)
                        .sort_by { |story| story_ids.index(story.id) }
      end

    else  # public reader
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
    # convert the story content to plain text (for SEO tags)
    @story_content_text = HtmlToPlainText.plain_text(@story.content)
    @related_stories = @story.related_stories
    @more_stories =
      @company.filter_stories_by_tag({ tag: 'all', id: '0' }, false)
              .delete_if { |story| story.id == @story.id || story.customer.logo_url.blank? }
              .map do |story|
                { title: story.title,
                  logo: story.customer.logo_url,
                  path: story.published ? story.csp_story_path : root_path,
                  is_published: story.published }
              end
  end

  def edit
    @customer = @story.success.customer
    @referrer_select = @story.success.contributions
                             .map { |c| [ c.contributor.full_name, c.contributor.id ] }
                             .unshift( [""] )
    @results = @story.success.results
    @prompts = @story.success.prompts
    # this is needed for the Result delete button...
    @base_url = request.base_url
  end

  # Notice how nested hash keys are treated as strings in the params hash
  # -> due to the way form parameters are name-spaced
  def create
    new_story = params[:story]
    if new_customer? new_story[:customer]
      customer = Customer.new name: new_story[:customer], company_id: @company.id
      unless customer.save
        @errors = "Customer is required"
        respond_to { |format| format.js } and return
      end
    else
      customer = Customer.find new_story[:customer]
    end
    success = Success.create customer_id: customer.id, curator_id: current_user.id
    story = Story.new title: new_story[:title], success_id: success.id
    if story.save
      story.assign_tags new_story
      story.success.create_default_prompts
      # flash[:success] = "Story created successfully"
      # # prevent js response from killing flash message
      # flash.keep(:success)
      @redirect_url = File.join request.base_url, edit_story_path(story.id)
    else
      @errors = story.errors.full_messages.join(', ')
    end
    respond_to { |format| format.js }
  end

  def update
    story = Story.find params[:id]
    if params[:customer_logo_url]
      story.success.customer.update logo_url: params[:customer_logo_url]
      respond_to { |format| format.json { render json: nil } }
    elsif params[:prompt]  # a prompt was edited
      Prompt.find(params[:prompt_id].to_i).update description: params[:prompt][:description]
      respond_to { |format| format.json { render json: nil } }
    # params[:story]* items must appear below, else error
    # (there is no params[:story] when params[:story_tags] or params[:result] are present)
    elsif params[:story][:content]
      story.update content: params[:story][:content]
      @new_content = story.content
      respond_to { |format| format.js { render action: 'update_content' } }
    elsif params[:story][:new_prompt]
      story.success.prompts << Prompt.create(description: params[:story][:new_prompt])
      @prompts = story.success.prompts
      @story_id = story.id
      @base_url = request.base_url  # needed for deleting a result
      respond_to { |format| format.js { render action: 'create_prompt_success' } }
    elsif params[:story][:embed_url]  # =>  embedded video
      story.update embed_url: new_embed_url_formatted(params[:story][:embed_url])
      # respond with json because we need to update the video iframe
      # with the modified url ...
      respond_to do |format|
        format.json { render json: story.as_json(only: :embed_url, methods: :video_info) }
      end
    elsif params[:story][:published]
      update_publish_state story, params[:story]
      respond_to do |format|
        # respond with the (possibly modified over user selection) publish state,
        # so client js can make necessary adjustments
        format.json { render json: story,
                             only: [:published, :logo_published] }
      end
    else  # all other updates
      story.update story_params
      respond_to do |format|
        format.json { respond_with_bip(story) }
      end
    end
  end

  def ctas
    @story.update_ctas( params[:ctas] || [] )
    respond_to { |format| format.js }
  end

  def tags
    @story.update_tags( params[:category_tags] || [], params[:product_tags] || [] )
    respond_to { |format| format.js }
  end

  def destroy
    @story.expire_cache_on_destroy
    @story.destroy
    respond_to { |format| format.js }
  end

  def approval
    respond_to do |format|
      format.pdf do
        render pdf: "#{@company.subdomain}-customer-story-#{@story.success.customer.slug}",
               template: "stories/approval.pdf.erb",
               locals: { story: @story,
                         company: @company,
                         customer_name: @story.success.customer.name,
                         contributors: @contributors },
               footer: { right: '[page] of [topage]' }
        end
    end
  end

  private

  def story_params
    params.require(:story).permit(:title, :quote, :quote_attr_name, :quote_attr_title, :embed_url, :situation,
        :challenge, :solution, :benefits, :published, :logo_published)
  end

  def set_company
    if params[:company_id]  # create story
      @company = Company.find params[:company_id]
    else
      @company = Company.find_by subdomain: request.subdomain
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
                      WHEN 'partner' THEN '2'
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
  def new_customer? customer
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

  def new_embed_url_formatted new_embed_url
    if new_embed_url.include? "youtube"
      # https://www.youtube.com/watch?v=BAjqPZY8sFg
      # or
      # https://www.youtube.com/embed/BAjqPZY8sFg
      youtube_id = new_embed_url.match(/(v=|\/)(?<id>\w+)(&|$)/)[:id]
      YOUTUBE_BASE_URL + "#{youtube_id}"
    elsif new_embed_url.include? "vimeo"
      vimeo_id = new_embed_url.match(/\/(?<id>\d+)$/)[:id]
      VIMEO_BASE_URL + "#{vimeo_id}"
    elsif new_embed_url.include? "wistia"
      # https://fast.wistia.com/embed/medias/avk9twrrbn.jsonp (standard)
      # or
      # https://fast.wistia.net/embed/iframe/avk9twrrbn (fallback)
      wistia_id = new_embed_url.match(/\/(?<id>\w+)($|\.\w+$)/)[:id]
      WISTIA_BASE_URL + "#{wistia_id}.jsonp"
    elsif new_embed_url.blank?
      nil
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

  def update_publish_state story, story_params
    publish_story = story_params[:published] == '1' ? true : false
    publish_logo = story_params[:logo_published] == '1' ? true : false
    # only update if the value has changed ...
    if publish_story && !story.published?
      story.published = true
      story.publish_date = Time.now
    elsif !publish_story && story.published?
      story.published = false
      story.publish_date = nil
    elsif publish_logo && !story.logo_published?
      story.logo_published = true
      story.logo_publish_date = Time.now
    elsif !publish_logo && story.logo_published?
      story.logo_published = false
      story.logo_publish_date = nil
    end
    # prevent false state ...
    if (publish_story && !publish_logo) && story.published_changed?
      story.logo_published = true
      story.logo_publish_date = Time.now
    elsif (publish_story && !publish_logo) && story.logo_published_changed?
      story.published = false
      story.publish_date = nil
    end
    story.save
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

  # check validity of query string parameters
  # at this point, only category or product are acceptable
  def valid_query_string? params
    return false if request.query_string.blank?
    company = Company.find_by subdomain: request.subdomain
    query_hash = Rack::Utils.parse_nested_query request.query_string
    valid_category = params.try(:[], :category) &&
                StoryCategory.joins(successes: { customer: {} })
                             .where(slug: params[:category],
                                    customers: { company_id: company.id } )
                             .present?
    valid_product = params.try(:[], :product) &&
                      Product.joins(successes: { customer: {} })
                             .where(slug: params[:product],
                                    customers: { company_id: company.id } )
                             .present?
    if query_hash.length === 1 && (valid_category || valid_product)
      true
    else
      redirect_to(root_path, flash: { warning: "Page doesn't exist" }) and return false
    end
  end

  # since we've already passed valid_query_string? method,
  # we know params and data are legit
  def get_filter_params_from_query params
    filter = {}
    if params[:category]
      filter[:tag] = 'category'
      filter[:id] = StoryCategory.friendly.find(params[:category]).id
    elsif params[:product]
      filter[:tag] = 'product'
      filter[:id] = Product.friendly.find(params[:product]).id
    else
      # error - should only be in this method if there was
      # a query string with category= or product=
    end
    filter
  end

  #
  # method returns a fragment cache key that looks like this:
  #
  #   trunity/curator-stories-index-{tag}-xx-memcache-iterator-yy
  #
  # tag is 'all', 'category', or 'product'
  # xx is the selected filter id (0 if none selected)
  # yy is the memcache iterator
  #
  def stories_index_cache_key company, is_curator, filter_params
    if is_curator
      memcache_iterator = company.curator_stories_index_fragments_memcache_iterator
    else
      memcache_iterator = company.public_stories_index_fragments_memcache_iterator
    end
    "#{company.subdomain}/" +
    "#{is_curator ? 'curator' : 'public'}-" +
    "stories-index-#{filter_params[:tag]}-#{filter_params[:id]}-" +  # id = 0 -> all
    "memcache-iterator-#{memcache_iterator}"
  end

  #
  # method returns a fragment cache key that looks like this:
  #
  #   trunity/curator-category-select-xx-memcache-iterator-yy
  #
  #   xx is the selected category id (0 if none selected)
  #   yy is the memcache iterator
  #
  def filter_select_cache_key company, is_curator, filter_tag, filter_params
    if filter_tag == filter_params[:tag]  # is this the filter that was selected?
      filter_id = filter_params[:id]
    else
      filter_id = 0
    end
    "#{company.subdomain}/" +
    "#{is_curator ? 'curator' : 'public'}-" +
    "#{filter_tag}-select-#{filter_id}-memcache-iterator-" +
    "#{filter_select_memcache_iterator(company, is_curator, filter_tag)}"
  end

  def filter_select_memcache_iterator company, is_curator, filter_tag
    if is_curator
      if filter_tag == 'category'
        company.curator_category_select_fragments_memcache_iterator
      else
        company.curator_product_select_fragments_memcache_iterator
      end
    else
      if filter_tag == 'category'
        company.public_category_select_fragments_memcache_iterator
      else
        company.public_product_select_fragments_memcache_iterator
      end
    end
  end

end
