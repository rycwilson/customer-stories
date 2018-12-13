class CustomersController < ApplicationController

  respond_to(:html, :json, :js)

  def show
    customer = Customer.find(params[:id])
    respond_with(customer, only: [:id, :name, :description, :logo_url, :show_name_with_logo])
  end

  def update
    @customer = Customer.find(params[:id])
    @customer.update(customer_params)
    respond_to do |format|
      format.html { redirect_to('/prospect', flash: { success: "Customer updated" }) }
      format.js { render({ action: 'customers/update' }) }
    end
    # json response (but we need to update some things in the client so let's send a script)
    # respond_to do |format|
    #   format.json do
    #     render({
    #       # data needed to update datatables
    #       json: customer.to_json({ only: [:id, :name, :slug] }),
    #       status: 200
    #     })
    #   end
    # end
  end

  private

  def customer_params
    params.require(:customer).permit(:name, :description, :logo_url, :show_name_with_logo)
  end

end
