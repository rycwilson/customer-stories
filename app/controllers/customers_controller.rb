# frozen_string_literal: true

class CustomersController < ApplicationController
  def edit
    @customer = Customer.friendly.find params[:id]
  end

  def update
    @customer = Customer.friendly.find params[:id]
    if @customer.update customer_params
      turbo_stream_actions = []
      if @customer.saved_change_to_name?
        turbo_stream_actions << turbo_stream.replace(
          'customer-navbar-link',
          partial: 'shared/customer_navbar_link',
          locals: { customer: @customer }
        )
      end
      flash.now[:notice] = 'Customer has been updated'
      turbo_stream_actions << turbo_stream.replace('toaster', partial: 'shared/toaster')
      render turbo_stream: turbo_stream_actions
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
