class CompaniesController < ApplicationController

  # GET /companies/new
  def new
    @company = Company.new
    # default industry tags
    @industries = INDUSTRIES
    render :show
  end

  # GET /companies/:id
  def show
    # TODO: what's the best balance of eager vs. lazy loading?
    # e.g. we're not eager loading products here...
    @company = Company.includes(:customers, :successes, :stories, :visitors).find params[:id]
    # options for new story customer select
    customers_select_options @company.customers
    # options for product categories select (multiple select)
    product_cats_select_options @company.product_categories
    # options for products select (single select for now)
    products_select_options @company.products
    # options for industries select (multiple select)
    industries_select_options @company.industry_categories
  end

  def create
    @company = Company.new company_params
    if @company.save
      @company.users << current_user
      @company.create_tags(params[:tags]) if params[:tags]
      @company.create_email_templates
      redirect_to company_path(@company), flash: { success: "Registered company ok" }
    else
      # validation(s): presence / uniqueness of name
      flash.now[:danger] = "#{@company.errors.full_messages}"
      # default industry categories
      @industries = INDUSTRIES
      render :show
    end

  end

  def update
  end

  private

  def company_params
    params.require(:company).permit(:name, :logo)
  end

end
