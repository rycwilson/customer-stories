class CompaniesController < ApplicationController

  before_action :set_s3_direct_post, only: [:new, :edit, :create]
  before_action :set_company, only: [:edit, :update]
  before_action :user_authorized?, only: :show

  # GET /companies/new
  def new
    @company = Company.new
  end

  # GET /companies/:id
  def show
    if params[:mainnav_tab]
      session[:mainnav_tab] = params[:mainnav_tab]
      redirect_to request.path
    else
      @mainnav_tab = session[:mainnav_tab] || 'curate'
      session[:mainnav_tab] = nil # reset - so refresh always goes back to curate
      # TODO: what's the best balance of eager vs. lazy loading?
      # e.g. we're not eager loading products here...
      @company = Company.includes(:customers, :successes, :stories, :visitors).find params[:id]
      @customers = @company.customers_select_options
      @categories = @company.category_select_options_all
      @products = @company.product_select_options_all
    end
  end

  def edit
    @company = Company.includes(:story_categories,
                                :products,
                                :email_templates).find params[:id]
    @categories = @company.category_select_options_all
    @categories_pre_select = @company.story_categories.map { |category| category.id }
    @products = @company.product_select_options_all
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
      render :new
    end

  end

  def update
    if @company.update company_params
      @company.update_tags(params[:company_tags]) if params[:company_tags].present?
      @flash_mesg = "Company profile updated"
      @flash_status = "success"
    else
      @flash_mesg = @company.errors.full_messages.join(', ')
      @flash_status = "danger"
    end
    respond_to do |format|
      format.html do
        redirect_to edit_company_path(@company),
          flash: { success: "Company profile updated" }
      end
      format.js
    end
  end

  private

  def company_params
    params.require(:company).permit(:name, :subdomain, :logo_url, :nav_color_1,
                                    :nav_color_2, :nav_text_color, :website)
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
