class CustomersController < ApplicationController

  # respond_to(:html, :js, :json)

  def edit
    @customer = Customer.find(params[:id])
    @s3_direct_post = set_s3_direct_post()
  end

  def update
    @customer = Customer.friendly.find(params[:id])
    @customer.update(customer_params)
    respond_to do |format|
      format.html { redirect_to('/prospect', flash: { success: "Customer updated" }) }
      format.js {}
    end
  end

  private

  def customer_params
    params.require(:customer).permit(:name, :description, :logo_url, :show_name_with_logo)
  end

end
