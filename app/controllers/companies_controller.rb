class CompaniesController < ApplicationController

  # aws docs suggest first four actions, currently only need last one
  before_action :set_s3_direct_post, only: [:new, :edit]
  before_action :set_company, only: [:edit, :update]
  before_action :user_authorized?, only: :show

  # GET /companies/new
  def new
    @company = Company.new
    @industries = INDUSTRIES
    @industries_pre_select = []
    @product_categories = []
    @product_cats_pre_select = []
    @products = []
    @products_pre_select = []
  end

  # GET /companies/:id
  def show
    if params[:mainnav_tab]
      session[:mainnav_tab] = params[:mainnav_tab]
      redirect_to request.path
    else
      @mainnav_tab = session[:mainnav_tab] || 'curate'
      # TODO: what's the best balance of eager vs. lazy loading?
      # e.g. we're not eager loading products here...
      @company = Company.includes(:customers, :successes, :stories, :visitors).find params[:id]
      @customers = @company.customers_select
      @industries = @company.industries_select # multiple select
      # @industries_pre_select = @company.industry_categories.map { |category| category.id }
      @product_categories = @company.product_categories_select # multiple select
      # @product_cats_pre_select = @company.product_categories.map { |category| category.id }
      @products = @company.products_select # single select (for now)
      # @products_pre_select = @company.products.map { |product| product.id }
    end
  end

  def edit
    @company = Company.includes(:industry_categories, :product_categories,
                                :products, :email_templates).find params[:id]
    @industries = @company.industries_select # multiple select
    @industries_pre_select = @company.industry_categories.map { |category| category.id }
    @product_categories = @company.product_categories_select # multiple select
    @product_cats_pre_select = @company.product_categories.map { |category| category.id }
    @products = @company.products_select # single select (for now)
    @products_pre_select = @company.products.map { |product| product.id }
    @templates_select = @company.templates_select
  end

  def create
    @company = Company.new company_params
    if @company.save
      @company.update_tags(params[:company_tags]) if params[:company_tags].present?
      @company.users << current_user
      @company.create_email_templates
      if current_user.linkedin_url.present?
        redirect_to File.join(request.protocol + "#{@company.subdomain}." + request.domain + request.port_string, company_path(@company)), flash: { success: "Account setup complete" }
      else
        redirect_to File.join(request.protocol + "#{@company.subdomain}." + request.domain + request.port_string, edit_profile_path), flash: { info: "Complete your account setup by connecting to LinkedIn" }
      end
    else
      # validation(s): presence / uniqueness of name, presence of subdomain
      flash.now[:danger] = "Unable to register: #{@company.errors.full_messages.join(', ')}"
      @industries = INDUSTRIES
      @industries_pre_select = []
      @product_categories = []
      @product_cats_pre_select = []
      @products = []
      @products_pre_select = []
      render :new
    end

  end

  def update
    if @company.update company_params
      @company.update_tags(params[:company_tags]) if params[:company_tags].present?
      @flash_mesg = "Account updated successfully"
      @flash_status = "success"
    else
      @flash_mesg = @company.errors.full_messages.join(', ')
      @flash_status = "danger"
    end
    respond_to do |format|
      format.html do
        redirect_to edit_company_path(@company),
          flash: { success: "Account updated successfully" }
      end
      format.js
    end
  end

  private

  def company_params
    params.require(:company).permit(:name, :subdomain, :logo_url)
  end

  def set_company
    @company = Company.find params[:id]
  end

  def user_authorized?
    if current_user.company_id == params[:id].to_i
      true
    else
      render file: 'public/403', status: 403, layout: false
      false
    end
  end

end
