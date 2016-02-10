class StoriesController < ApplicationController

  before_action :set_company, only: [:index, :create]
  before_action :set_story, only: [:show, :edit]
  before_action :auth_user?, only: [:edit]

  def index
    if params[:filter]  # ajax GET request
      @stories = @company.filter_stories params[:filter][:type], params[:filter][:id]
      respond_to do |format|
        format.json { render json: @stories }
      end
    else
      @stories = @company.stories
      @industries = @company.industries_filter_select
    end
  end

  def show
    @contributors = @story.success.contributions
                          .where(linkedin: :true).map { |c| c.user }
    @contributors << @story.success.curator
  end

  def edit
    @company = current_user.company # company_id not in the stories#edit route
    @contributions = @story.success.contributions
    @contributions_in_progress = Contribution.in_progress @story.success_id
    @industries = @company.industries_select
    @industries_pre_select = @story.success.industry_categories
                                   .map { |category| category.id }
    @product_categories = @company.product_categories_select
    @product_cats_pre_select = @story.success.product_categories
                                     .map { |category| category.id }
    @products = @company.products_select
    @products_pre_select = @story.success.products
                                 .map { |category| category.id }
    @referrer_select = @story.success.contributions
                             .map { |c| [ c.contributor.full_name, c.contributor.id ] }
                             .unshift( [""] )
  end

  # TODO: allow for new Customer creation
  # Notice how nested hash keys are treated as strings in the params hash
  # -> due to the way form parameters are name-spaced
  def create
    new_story = params[:story]
    # was a new customer entered? ...
    new_customer = new_story[:customer] if new_story[:customer].to_i == 0
    if new_customer
      customer = Customer.new name: new_customer, company_id: @company.id
      if customer.save
        success = Success.new customer_id: customer.id
      else
        puts 'problem creating Customer'
      end
    else  # existing customer
      success = Success.new customer_id: new_story[:customer]
    end
    if success.save
      success.curator = current_user
      story = Story.new title: new_story[:title], success_id: success.id
      if story.save
        story.assign_tags new_story
        redirect_to edit_story_path story
      else
        # problem creating story
        # TODO: wire up some flash messaging, possible to re-render the modal??
        puts 'problem creating Story'
      end
    else
      puts 'problem creating Success'
    end
  end

  def update
    story = Story.find params[:id]
    if params[:story_tags] # if updating tags
      story.update_tags params[:story_tags]
      respond_to do |format|
        format.js
      end
    elsif params[:story][:embed_url]  # if updating video url
      youtube_id = params[:story][:embed_url].match(/v=(?<id>.*)/)[:id]
      params[:story][:embed_url] = "https://www.youtube.com/embed/" + youtube_id
      respond_to do |format|
        if story.update story_params
          # respond with json because we need to update the input field
          # on client side with the modified url ...
          format.json { render json: story.as_json(only: :embed_url) }
        else
          #
        end
      end
    elsif params[:story][:published]
      if story.update story_params
        respond_to do |format|
          format.json { render json: nil } # empty response
        end
      else
      end
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
        info: "Story '#{story.title}' was deleted"
  end

  private

  def story_params
    params.require(:story).permit(:title, :quote, :quote_attr, :embed_url, :situation,
        :challenge, :solution, :results, :published, :logo_published)
  end

  def set_company
    if params[:company_id].present?  # create
      @company = Company.find params[:company_id]
    else  # index
      @company = Company.find_by subdomain: request.subdomain
    end
  end

  def set_story
    @story = Story.find params[:id]
  end

  def auth_user?
    if current_user.company_id == Story.find(params[:id]).success.customer.company.id
      true
    else
      render file: 'public/403', status: 403, layout: false
      false
    end
  end

end
