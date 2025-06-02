class CustomersController < ApplicationController

  def edit
    @customer = Customer.friendly.find(params[:id])
  end

  def update
    @customer = Customer.friendly.find(params[:id])
    if @customer.update(customer_params)
      redirect_back(fallback_location: dashboard_path('curate'), flash: { notice: "Customer has been updated" })
    else 
      @errors = @customer.errors.full_messages
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def customer_params
    params.require(:customer).permit(:name, :description, :logo_url, :show_name_with_logo)
  end

end
