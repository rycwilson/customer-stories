class CustomersController < ApplicationController

  respond_to(:html, :js, :json)

  def show
    customer = Customer.find(params[:id])
    respond_with(customer, only: [:id, :name, :description, :logo_url, :show_name_with_logo])
  end

  def update
    @customer = Customer.find(params[:id])
    @customer.update(customer_params)
    respond_to do |format|
      format.html { redirect_to('/prospect', flash: { success: "Customer updated" }) }
      format.js {}
      # format.json { render({ json: @customer.to_json }) }
    end
  end

  private

  def customer_params
    params.require(:customer).permit(:name, :description, :logo_url, :show_name_with_logo)
  end

end
