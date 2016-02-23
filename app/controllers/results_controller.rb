class ResultsController < ApplicationController

  def destroy
    result = Result.find params[:id]
    result.destroy
    respond_to { |format| format.json { render json: { result: result.id } } }
  end

end
