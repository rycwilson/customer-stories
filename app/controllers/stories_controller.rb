class StoriesController < ApplicationController

  def index
    @stories = Company.find(params[:id]).stories
  end

  def new
  end

  def show
  end

  def edit
  end

  def create
  end

  def update
  end

  def destroy
  end

end
