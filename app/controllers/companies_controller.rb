class CompaniesController < ApplicationController

  # GET /companies/new
  def new
    @company = Company.new
    # default industry categories
    @industry_cats = ['Education', 'Government', 'Financial Services', 'Healthcare', 'Hospitality', 'Manufacturing', 'Media and Entertainment', 'Service Provider', 'Technology', 'IT', 'Telecommunications'];
    render :show
  end

  # GET /companies/:id
  def show
    # TODO: what's the best balance of eager vs. lazy loading?
    # e.g. we're not eager loading products here...
    @company = Company.includes(:customers, :successes, :stories).find params[:id]
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
    @company = Company.create company_params
    if @company.save
      @company.users << current_user
      # create the industry tags if any were entered
      # no validations are run on these
   #   unless params[:industry_tags].empty?
    #    params[:industry_tags].each do |tag|
     #     @company.industry_categories << IndustryCategory.create(name: tag)
      #  end
    #  end
    #  unless params[:product_tags].empty?
    #    params[:product_tags].each do |tag|
     #     @company.product_categories << ProductCategory.create(name: tag)
      #  end
    #  end
      redirect_to company_path(@company), flash: { success: "Registered company ok" }
    else
      flash.now[:danger] = "There was a problem"
      @company = Company.new
      render :show
    end

  end

  def update
  end

  private

  def company_params
    params.require(:company).permit(:name, :logo)
  end

  def customers_select_options company_customers
    @customers_select = company_customers.map do |customer|
      [ customer.name, customer.id ]
    end
    .unshift( ["", 0] )  # empty option makes placeholder possible
    # if sending the options to javascript use .to_json:
    # .to_json
  end

  def product_cats_select_options company_product_cats
    @product_cats_select = company_product_cats.map do |category|
      [ category.name, category.id ]
    end
    .unshift( ["", 0] )
  end

  def products_select_options company_products
    @products_select = company_products.map do |product|
      [ product.name, product.id ]
    end
    .unshift( ["", 0] )
  end

  def industries_select_options company_industries
    @industries_select = company_industries.map do |industry|
      [ industry.name, industry.id ]
    end
    .unshift( ["", 0] )
  end

end
