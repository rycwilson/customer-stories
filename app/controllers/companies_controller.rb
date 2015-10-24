class CompaniesController < ApplicationController

  # GET /companies/new
  def new
    @company = Company.new
    # hard-coded industry tags (for now)
    @industry_cats = ['Education', 'Government', 'Financial Services', 'Healthcare', 'Hospitality', 'Manufacturing', 'Media and Entertainment', 'Service Provider', 'Technology', 'IT', 'Telecommunications'];
    render :show
  end

  # GET /companies/:id
  def show
    @company = Company.includes({ successes: [:customer] }, :stories).find params[:id]
    # hard-coded industry tags (for now)
    @industry_cats = ['Education', 'Government', 'Financial Services', 'Healthcare', 'Hospitality', 'Manufacturing', 'Media and Entertainment', 'Service Provider', 'Technology', 'IT', 'Telecommunications'];
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

end
