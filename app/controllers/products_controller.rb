class ProductsController < ApplicationController

  # need to get the id by slug, so that filter select boxes can be updated
  # if a query string is present
  def show
    respond_to do |format|
      format.json do
        render json: Product.where(slug: params[:slug],
                                   company_id: params[:company_id]).take
      end
    end
  end

end
