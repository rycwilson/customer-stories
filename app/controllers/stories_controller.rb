class StoriesController < ApplicationController

  def index
    @stories = Company.find(params[:id]).stories
  end

  def show
    @story = Story.find params[:id]
  end

  def edit
  end

  # TODO: allow for new Company creation
  def create
    @company = Company.find params[:id]
    @customer = Customer.find params[:customer]
    @success = Success.create customer_id: params[:customer]
    @story = Story.create title: params[:title], success_id: @success.id

    redirect_to edit_story_path @story.id
  end

  def update
  end

  def destroy
  end

end
