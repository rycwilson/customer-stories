class CompaniesController < ApplicationController

  before_action :user_authorized?, only: [:show, :edit]
  before_action :set_company, except: [:new, :create]
  before_action only: [:show, :edit ] { set_gon(@company) }
  before_action :set_s3_direct_post, only: [:new, :edit, :show, :create]

  def new
    @profile_form_options = set_profile_form_options(params)
    @company = Company.new
  end

  def show
    @workflow_tab = cookies[:workflow_tab] || 'curate'
    @workflow_sub_tab = cookies[:workflow_sub_tab]
    cookies.delete(:workflow_tab) if cookies[:workflow_tab]
    cookies.delete(:workflow_sub_tab) if cookies[:workflow_sub_tab]
    @recent_activity = Rails.cache.fetch("#{@company.subdomain}/recent-activity") { @company.recent_activity(30) }
    @story_views_30_day_count = PageView.joins(:visitor_session)
                                 .company_story_views_since(@company.id, 30).count
  end

  def edit
    @profile_form_options = set_profile_form_options(params)
    @templates_select = @company.templates_select
  end

  def create
    @company = Company.new company_params
    if @company.save
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

  # two response formats needed to handle the s3 upload
  def update
    if @company.update company_params
      @flash_mesg = "Company updated"
      @flash_status = "success"
    else
      @flash_mesg = @company.errors.full_messages.join(', ')
      @flash_status = "danger"
    end
    respond_to do |format|
      format.html do
        redirect_to edit_company_path(@company),
          flash: { success: "Company updated" }
      end
      format.js {}
    end
  end

  def adwords_config
    if @company.update(company_params)
      # if the default image wasn't set or changed, parameter won't show up
      if (@default_image_changed = params[:company][:default_adwords_image_url].present?)
        update_default_adwords_image( @company, params[:company][:default_adwords_image_url] )
      end
    else
      @flash_mesg = @company.errors.full_messages.join(', ')
      @flash_status = "danger"
    end
    respond_to do |format|
      # image uploads are always synchronous
      format.html do
        # forward params so new image urls can be uploaded to adwords api
        redirect_to( update_company_adwords_path( company: params[:company] ) )
      end
      format.js {} # js response will $.get the adwords update
    end
  end

  def tags
    @company.update_tags( params[:category_tags] || [], params[:product_tags] || [] )
    respond_to { |format| format.js }
  end

  def widget
    @company.widget.update(widget_params)
    respond_to { |format| format.js }
  end

  private

  def company_params
    params.require(:company)
          .permit(:name, :subdomain, :logo_url, :header_color_1,
                  :header_color_2, :header_text_color, :website, :gtm_id,
                  :adwords_short_headline, :adwords_logo_url,
                  adwords_images_attributes: [:id, :image_url, :_destroy])
  end

  def widget_params
    params.require(:widget)
          .permit(:tab_color, :text_color, :show, :show_delay, :show_freq, :hide, :hide_delay)
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

  def set_profile_form_options params
    options = {
      html: {
        class: 'directUpload',
        data: {
          'form-data' => (@s3_direct_post.fields),
          'url' => @s3_direct_post.url,
          'host' => URI.parse(@s3_direct_post.url).host
        }
      }
    }
    if params[:action] == 'edit'
      options.merge({ method: 'put', remote: 'true', authenticity_token: true })
    else
      options
    end
  end

  def update_default_adwords_image company, image_url
    adwords_image = company.adwords_images.default ||
                    AdwordsImage.create(company_id: company.id, company_default: true)
    adwords_image.update(image_url: image_url)
  end

end
