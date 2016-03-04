class ResultsController < ApplicationController

  def create
    story = Story.find params[:story_id]
    @story_id = story.id
    @base_url = request.base_url
    @result = Result.new description: params[:description]
    if @result.save
      story.success.results << @result
      @results = story.success.results
      respond_to { |format| format.js }
    else
      @flash_error = "Result can't exceed 50 characters"
      respond_to { |format| format.js }
    end
  end

  def update
    @result = Result.find params[:id]
    @result.update description: params[:result][:description]
    respond_to { |format| format.json { respond_with_bip(@result) } }
  end

  # method responds with the deleted Result object's id
  # the id isn't needed by client, however if empty response (e.g. format.json { head :ok }),
  # then response isn't caught by the AJAX success handler
  def destroy
    result = Result.find params[:id]
    result.destroy
    respond_to { |format| format.json { render json: { result: result.id } } }
  end

end
