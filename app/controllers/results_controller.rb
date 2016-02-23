class ResultsController < ApplicationController

  # method responds with the deleted Result object's id
  # the id isn't needed by client, however if empty response (e.g. format.json { head :ok }),
  # then response isn't caught by the AJAX success handler
  def destroy
    result = Result.find params[:id]
    result.destroy
    respond_to { |format| format.json { render json: { result: result.id } } }
  end

end
