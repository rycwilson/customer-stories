class CustomersController < ApplicationController

  respond_to(:html, :js, :json)

  def edit
    customer = Customer.find(params[:id])
    customer.s3_direct_post_fields = set_s3_direct_post().fields
    respond_with(customer, only: [:id, :name, :description, :logo_url, :show_name_with_logo], methods: [:s3_direct_post_fields])
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
