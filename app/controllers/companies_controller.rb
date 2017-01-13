class CompaniesController < ApplicationController

  before_action :user_authorized?, only: [:show, :edit]
  before_action :set_company, except: [:new, :create]
  before_action only: [:show, :edit] { set_gon(@company) }
  before_action :set_s3_direct_post, only: [:new, :edit, :create]

  def new
    @company = Company.new
  end

  def show
    @workflow_tab = cookies[:csp_workflow_tab] || 'curate'
    cookies.delete(:csp_workflow_tab) if cookies[:csp_workflow_tab]
    @customer_select_options = @company.customer_select_options
    @category_select_options = @company.category_select_options
    @product_select_options = @company.product_select_options
    @recent_activity = @company.recent_activity(30)
    @story_views_30_day_count = PageView.joins(:visitor_session)
                                  .company_story_views_since(@company.id, 30).count

    gon.push({
      charts: {
        referrerTypes: VisitorSession.select(:referrer_type)
                         .joins(:visitor_actions)
                         .where(visitor_actions: { company_id: @company.id })
                         .where('timestamp >= ?', 30.days.ago)
                         .group_by { |session| session.referrer_type }
                         .map { |type, records| [type,records.count] }
      }
    })
    @story_select_options = @company.story_select_options
  end

  def edit
    @category_select_options = @company.category_select_options
    @category_pre_selected_options = @company.story_categories.map { |category| category.id }
    @product_select_options = @company.product_select_options
    @product_pre_selected_options = @company.products.map { |product| product.id }
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
      flash[:danger] = @company.errors.full_messages.join(', ')
      redirect_to new_company_path
    end

  end

  def update
    if @company.update company_params
      @company.update_tags(params[:company_tags]) if params[:company_tags].present?
      @flash_mesg = "Company updated"
      @flash_status = "success"
    else
      @flash_mesg = @company.errors.full_messages.join(', ')
      @flash_status = "danger"
    end
    if @company.cta_button.blank?
      @company.cta_button = CtaButton.create(
                             url: params[:cta][:url],
                             btn_text: params[:cta][:btn_text],
                             color: params[:cta][:color],
                             background_color: params[:cta][:background_color])
    else
      @company.cta_button.update(
                url: params[:cta][:url],
                btn_text: params[:cta][:btn_text],
                color: params[:cta][:color],
                background_color: params[:cta][:background_color])
    end

    respond_to do |format|
      format.html do
        redirect_to edit_company_path(@company),
          flash: { success: "Company updated" }
      end
      format.js
    end
  end


  private

  def company_params
    params.require(:company).permit(:name, :subdomain, :logo_url, :nav_color_1,
                                    :nav_color_2, :nav_text_color, :website, :gtm_id)
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

  # def clicky_session_request session_id, company
  #   Typhoeus::Request.new(
  #     GETCLICKY_API_BASE_URL,
  #     method: :get,
  #     body: nil,
  #     params: { site_id: ENV['GETCLICKY_SITE_ID'],
  #               sitekey: ENV['GETCLICKY_SITE_KEY'],
  #               type: 'visitors-list',
  #               date: company.subdomain == 'varmour' ? 'last-1-days' : 'last-7-days',
  #               session_id: session_id,
  #               limit: 'all',
  #               output: 'json' },
  #     headers: { Accept: "application/json" }
  #   )
  # end

end
