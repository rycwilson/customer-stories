class CustomersController < ApplicationController

  respond_to(:html, :json)

  def show
    customer = Customer.find(params[:id])
    respond_with(customer, only: [:id, :name, :logo_url, :show_name_with_logo])
  end

  def update
    puts params

  end

  private

  def customer_params
    params.require(:customer).permit(:name, :logo_url, :show_name_with_logo)
  end

end
