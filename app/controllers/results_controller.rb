class ResultsController < ApplicationController

  def create
    story = Story.find(params[:story_id])
    @story_id = story.id
    @base_url = request.base_url
    @result = Result.new description: params[:description]
    if @result.save
      story.expire_results_fragment_cache
      story.success.results << @result
      @results = story.success.results
      respond_to { |format| format.js }
    else
      @flash_error = "Result can't exceed 70 characters"
      respond_to { |format| format.js }
    end
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
