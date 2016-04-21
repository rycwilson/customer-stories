class StoriesController < ApplicationController

  before_action :set_company, only: [:index, :show, :create]
  before_action :set_public_story_or_redirect, only: :show
  before_action :set_story, only: :edit
  before_action :user_authorized?, only: [:edit]
  before_action :set_s3_direct_post, only: [:edit]

  def index
    if params[:filter]
      @success_tiles =
          @company.filter_successes_by_tag params[:filter][:tag], params[:filter][:id]
      respond_to do |format|
        format.json do
          render json: @success_tiles,
              include: { story: { only: :slug },
                      products: { only: :slug },
                      customer: { only: [:slug, :logo_url] } }
        end
      end
    elsif curator?
      @success_tiles = @company.successes_with_story    # all stories
      @industries = @company.industries_select_options  # all industries
                            .unshift( ["All", 0] )
    elsif @company.feature_flag == 'alpha'
      redirect_to request.protocol + request.domain + request.port_string
    else  # public reader
      @success_tiles = @company.successes_with_logo_published
      # select options populated only with industries that are connected
      # to a story with logo published ...
      @industries = @company.industries_filter_select_options
    end
  end

  def show
    @contributors = @story.success.contributions
                          .where(linkedin: true).map { |c| c.contributor }
    @contributors << @story.success.curator unless @contributors.any? { |c| c.email == @story.success.curator.email }
    @contributions_in_progress = Contribution.in_progress @story.success_id
  end

  def edit
    @company = current_user.company # company_id not in the stories#edit route
    @customer = @story.success.customer
    @contributions_pre_request = Contribution.pre_request @story.success_id
    @contributions_in_progress = Contribution.in_progress @story.success_id
    @contributions_next_steps = Contribution.next_steps @story.success_id
    @contributions_contributors = Contribution.contributors @story.success_id
    @contributions_connections = Contribution.connections @story.success_id
    @industries = @company.industries_select_options
    @industries_pre_select = @story.success.industry_categories
                                   .map { |category| category.id }
    @product_categories = @company.product_categories_select_options
    @product_cats_pre_select = @story.success.product_categories
                                     .map { |category| category.id }
    @products = @company.products_select_options
    @products_pre_select = @story.success.products
                                 .map { |category| category.id }
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
    if new_story[:customer].to_i == 0  # new customer?
      customer = Customer.new name: new_story[:customer], company_id: @company.id
      unless customer.save
        @flash_mesg = "Customer field can't be blank"
        respond_to { |format| format.js { render action: 'create_error' } } and return
      end
    else
      customer = Customer.find new_story[:customer]
    end
    success = Success.create customer_id: customer.id, curator_id: current_user.id
    story = Story.new title: new_story[:title], success_id: success.id
    if story.save
      story.assign_tags new_story
      story.success.create_default_prompts
      flash[:success] = "Story created successfully"
      # prevent js response from killing flash message
      flash.keep(:success)
      @redirect = File.join request.base_url, edit_story_path(story.id)
      respond_to { |format| format.js { render action: 'create_success' } }
    else
      @flash_mesg = story.errors.full_messages.join(', ')
      respond_to { |format| format.js { render action: 'create_error' } }
    end
  end

  def update
    story = Story.find params[:id]
    if params[:story_tags]  # updated tags
      story.update_tags params[:story_tags]
      respond_to do |format|
        format.js
      end
    elsif params[:customer_logo_url]
      story.success.customer.update logo_url: params[:customer_logo_url]
      respond_to { |format| format.json { render json: nil } }
    elsif params[:prompt]  # a prompt was edited
      Prompt.find(params[:prompt_id].to_i).update description: params[:prompt][:description]
      respond_to { |format| format.json { render json: nil } }
    # params[:story]* items must appear below, else error
    # (there is no params[:story] when params[:story_tags] or params[:result] are present)
    elsif params[:story][:new_prompt]
      story.success.prompts << Prompt.create(description: params[:story][:new_prompt])
      @prompts = story.success.prompts
      @story_id = story.id
      @base_url = request.base_url  # needed for deleting a result
      respond_to { |format| format.js { render action: 'create_prompt_success' } }
    elsif params[:story][:embed_url]  # embedded video
      if params[:story][:embed_url].match(/youtube/)
        youtube_id = params[:story][:embed_url].match(/v=(?<id>.+)/)[:id]
        story.update embed_url: "https://www.youtube.com/embed/#{youtube_id}"
      elsif params[:story][:embed_url].match(/vimeo/)
        vimeo_id = params[:story][:embed_url].match(/\/(?<id>\d+)$/)[:id]
        story.update embed_url: "https://player.vimeo.com/video/#{vimeo_id}"
      end
      # respond with json because we need to update the video iframe
      # with the modified url ...
      respond_to do |format|
        format.json { render json: story.as_json(only: :embed_url) }
      end
    elsif params[:story][:published]
      publish_story = params[:story][:published] == '1' ? true : false
      publish_logo = params[:story][:logo_published] == '1' ? true : false
      # only update if the value has changed ...
      unless (publish_story && story.published?) || (!publish_story && !story.published?)
        if publish_story
          story.update(published: publish_story, publish_date: Time.now)
        else
          story.update(published: publish_story, publish_date: nil)
        end
      end
      unless (publish_logo && story.logo_published?) || (!publish_story && !story.published?)
        if publish_logo
          story.update(logo_published: publish_logo)
        else
          story.update(logo_published: publish_logo)
        end
      end
      respond_to { |format| format.json { head :ok } } # empty response
    else  # all other updates
      respond_to do |format|
        if story.update story_params
          # format.html { redirect_to(@story, :notice => 'Story was successfully updated.') }
          format.json { respond_with_bip(story) }
        else
          # format.html { render :action => "edit" }
          # format.json { respond_with_bip(story) }
        end
      end
    end
  end

  def destroy
    story = Story.find params[:id]
    story.destroy
    redirect_to company_path(current_user.company_id),
        flash: { info: "Story '#{story.title}' was deleted" }
  end

  private

  def story_params
    params.require(:story).permit(:title, :quote, :quote_attr, :embed_url, :situation,
        :challenge, :solution, :benefits, :published, :logo_published)
  end

  def set_company
    if params[:company_id].present?  # create
      @company = Company.find params[:company_id]
    else  # index
      @company = Company.find_by subdomain: request.subdomain
    end
  end

  def set_public_story_or_redirect
    @story = Story.friendly.find params[:title]
    if request.path != public_story_path(@story.success.customer.slug,
                                          @story.success.products[0].slug,
                                          @story.slug)
      return redirect_to public_story_path(@story.success.customer.slug,
                                            @story.success.products[0].slug,
                                            @story.slug), status: :moved_permanently
    end
  end

  def set_story
    @story = Story.find params[:id]
  end

  def user_authorized?
    if current_user.company_id == Story.find(params[:id]).success.customer.company.id
      true
    else
      render file: 'public/403', status: 403, layout: false
      false
    end
  end

end
