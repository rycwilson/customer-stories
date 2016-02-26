class PromptsController < ApplicationController

  # method responds with the deleted Prompt object's id
  # the id isn't needed by client, however if empty response (e.g. format.json { head :ok }),
  # then response isn't caught by the AJAX success handler
  def destroy
    prompt = Prompt.find params[:id]
    prompt.destroy
    respond_to { |format| format.json { render json: { prompt: prompt.id } } }
  end

end
