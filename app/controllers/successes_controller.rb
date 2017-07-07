
class SuccessesController < ApplicationController

  before_action(except: [:create]) { @success = Success.find(params[:id]) }

  def create
    binding.remote_pry
    @success = Success.create(success_params)
    # if @success.save
    # else
    # end
    respond_to() { format.js() {} }
  end

  def update
  end

  def destroy
  end

  private

  def success_params
    params.require(:success).permit(:name, :description, :customer_id)
  end

end