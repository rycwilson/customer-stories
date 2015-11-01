class StoriesController < ApplicationController

  def index
    @stories = Company.find(params[:id]).stories
  end

  def show
    @story = Story.find params[:id]
  end

  def edit
    @story = Story.find params[:id]
  end

  # TODO: allow for new Customer creation
  # Notice how nested hash keys are treated as strings in the params hash
  # -> due to the way form parameters are name-spaced
  def create
    @company = Company.find params[:id]
    @success = Success.new customer_id: params[:story][':customer']
    if @success.save
      @story = Story.new title: params[:story][':title'], success_id: @success.id
      if @story.save
        assign_tags @story, params[:story]
        redirect_to edit_story_path @story
      else
        # problem creating story
        # TODO: wire up some flash messaging, possible to re-render the modal??
        puts 'problem creating success'
      end
    else
      puts 'problem creating story'
    end
  end

  def update
  end

  def destroy
  end

  private

  # Only necessary for mass assignment on db action create or update
  # def tale_params
  #   params.require(:tale).permit(:customer, :title,
  #       # note the tag arrays explicitly set as such, else they won't be permitted
  #       industry_tags: [], product_cat_tags: [], product_tags: [])
  # end

  def assign_tags story, story_params
    story_params[':industry_tags'].each do |id|
      story.success.industry_categories << IndustryCategory.find(id)
    end
    story_params[':product_cat_tags'].each do |id|
      story.success.product_categories << ProductCategory.find(id)
    end
    story_params[':product_tags'].each do |id|
      story.success.products << Product.find(id)
    end
  end

end
