class CustomersController < ApplicationController

  def edit
    @customer = Customer.friendly.find(params[:id])
    # render(:edit, layout: false)
  end

  def update
    @customer = Customer.friendly.find(params[:id])
    unless @customer.update(customer_params)
      @errors = @customer.errors.full_messages
    end
    respond_to do |format|
      format.html { redirect_to('/prospect', flash: { success: "Customer updated" }) }
      format.json do 
        render(json: { status: @errors ? :unprocessable_entity : :ok, errors: @errors })
      end
    end
  end

  private

  def customer_params
    params.require(:customer).permit(:name, :description, :logo_url, :show_name_with_logo)
  end

end
