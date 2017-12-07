class CompaniesController < ApplicationController

  before_action :user_authorized?, only: [:edit, :show]
  before_action :set_company, except: [:new, :create]
  before_action only: [:show, :edit] { set_gon(@company) }
  before_action :set_s3_direct_post, only: [:new, :edit, :show, :create]

  def new
    @profile_form_options = set_profile_form_options(params)
    @company = Company.new
  end

  def show
    redirect_to('/curate') if request.path.match(/\/companies\/\d+/)
    @workflow_stage = params[:workflow_stage]
    @prospect_tab = request.cookies['prospect-tab'] || '#successes'
    @recent_activity = Rails.cache.fetch("#{@company.subdomain}/recent-activity") { @company.recent_activity(30) }
    @story_views_30_day_count = PageView.joins(:visitor_session)
                                 .company_story_views_since(@company.id, 30).count
    @curate_view = 'stories'
    # note: app data is obtained via json (see set_gon() in application controller)
  end

  def edit
    redirect_to(company_settings_path) if request.path.match(/\/companies\/\d+/)
    @profile_form_options = set_profile_form_options(params)
  end

  def create
    @company = Company.new(company_params)
    if @company.save
      @company.users << current_user
      if current_user.linkedin_url.present?
        redirect_to File.join(request.protocol + "#{@company.subdomain}." + request.domain + request.port_string, company_path(@company)), flash: { success: "Account setup complete" }
      else
        redirect_to File.join(request.protocol + "#{@company.subdomain}." + request.domain + request.port_string, edit_profile_path), flash: { info: "Complete your account setup by connecting to LinkedIn" }
      end
    else
      # validation(s): presence / uniqueness of name, presence of subdomain
      flash[:danger] = @company.errors.full_messages.join(', ')
      redirect_to(new_company_path)
    end

  end

  # two response formats needed to handle the s3 upload
  def update
    if @company.update(company_params)
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

  def promote
    # capture deleted image data (associated ads) prior to destroying image
    if removed_adwords_images?(params[:company][:adwords_images_attributes])
      params[:company][:removed_images_ads] =
        removed_images_ads(@company, params[:company][:adwords_images_attributes])
    end
    # make this check before updating anything
    # this will check for either uploaded or swapped default image
    default_image_changed = default_adwords_image_changed?(company_params, @company.adwords_images.default.try(:id))
    if @company.update(company_params)
      # if a new default image was uploaded (param won't be present if it wasn't)
      if default_image_changed && company_params[:default_adwords_image_url].present?
        @company.update_uploaded_default_adwords_image(company_params[:default_adwords_image_url])
        params[:company][:uploaded_default_image] = true
      elsif default_image_changed  # swapping images
        puts "swapping defaults"
        params[:company][:swapped_default_image] = true
      end
    else
      @flash_mesg = @company.errors.full_messages.join(', ')
      @flash_status = "danger"
    end
    respond_to do |format|
      # image uploads are always synchronous
      format.html do
        # forward params so new image urls can be uploaded to adwords api
        redirect_to(adwords_company_path(@company, company: params[:company]))
      end
      # js response will PUT the adwords update
      format.js {
        @company_params = params[:company].except(:adwords_images_attributes)
      }
    end
  end

  def tags
    @company.update_tags( params[:category_tags] || [], params[:product_tags] || [] )
    respond_to { |format| format.js }
  end

  def widget
    @company.widget.update( widget_params )
    respond_to { |format| format.js }
  end

  private

  def company_params
    params.require(:company)
          .permit(:name, :subdomain, :logo_url, :header_color_1,
                  :header_color_2, :header_text_color, :website, :gtm_id,
                  :adwords_short_headline, :adwords_logo_url, :default_adwords_image_url,
                  { adwords_images_attributes: [:id, :image_url, :company_default, :_destroy] } )
  end

  def widget_params
    params.require(:widget)
          .permit(:tab_color, :text_color, :show, :show_delay, :show_freq, :hide, :hide_delay)
  end

  def set_company
    @company = Company.find(params[:id])
  end

  def user_authorized?
    if current_user.company_id == params[:id].to_i
      true
    else
      render file: 'public/403', status: 403, layout: false
      false
    end
  end

  def set_profile_form_options (params)
    options = {
      html: {
        id: 'company-profile-form',
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

  def removed_adwords_images? (images_attributes)
    return false if images_attributes.nil?
    images_attributes.any? { |index, attrs| attrs[:_destroy] == 'true' }
  end

  # returns a hash containing ad/ad_group/campaign data associated with removed images
  def removed_images_ads (company, images_attributes)
    images_attributes
      .select { |index, attrs| attrs['_destroy'] == 'true' }
      .flatten.delete_if { |item| item.is_a?(String) }  # get rid of indices
      .map do |image|
        ads = AdwordsImage.find(image[:id]).ads
        # switch to default image
        ads.each { |ad| ad.adwords_image = company.adwords_images.default }
        {
          image_id: image[:id],
          ads_params: ads.map do |ad|
            {
              ad_id: ad.ad_id, ad_group_id: ad.ad_group.ad_group_id,
              csp_ad_id: ad.id,
              campaign_type: ad.campaign.type == 'TopicCampaign' ? 'topic' : 'retarget'
            }
          end
        }
      end
  end

  def default_adwords_image_changed? (company_params, default_image_id)
    company_params[:default_adwords_image_url].present? ||  # uploaded
    company_params[:adwords_images_attributes]
      .select { |index, image| image[:company_default] == 'true' }
      .values[0][:id].to_i != default_image_id
  end

end
