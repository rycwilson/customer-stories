class CompaniesController < ApplicationController

  before_action :authenticate_user!, only: [:show]
  # application#check_subdomain takes care of this...
  # before_action :user_authorized?, only: [:edit, :show]
  before_action :set_company, except: [:new, :create, :promote, :get_curators, :get_invitation_templates]
  before_action(only: [:show, :edit]) { set_gon(@company) }
  before_action :set_s3_direct_post, only: [:new, :edit, :show, :create]

  def new
    @company = Company.new
    @form_options = set_form_options(params)
    render :company_settings
  end

  def show
    redirect_to('/curate') if request.path.match(/\/companies\/\d+/)
    @workflow_stage = params[:workflow_stage]
    @prospect_tab = request.cookies['prospect-tab'] || '#successes'
    @promote_tab = request.cookies['promote-tab'] || '#promoted-stories'
    @recent_activity = Rails.cache.fetch("#{@company.subdomain}/recent-activity") { @company.recent_activity(30) }
    @story_views_30_day_count = PageView.joins(:visitor_session)
                                .company_story_views_since(@company.id, 30).count
    # note: app data is obtained via json (see set_gon() in application controller)
    @curate_view = 'stories'
  end

  def edit
    redirect_to(company_settings_path) if request.path.match(/\/companies\/\d+/)
    @tab = request.cookies['company-tab'] || '#edit-company-profile'
    @form_options = set_form_options(params, @company)
    render :company_settings
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
      redirect_to(register_company_path)
    end

  end

  def update
    if params[:tags]
      @company.update_tags(params[:category_tags] || [], params[:product_tags] || [])
      @flash = {}
    else
      @company.update(company_params) ?
        @flash = {} :
        @flash = { mesg: @company.errors.full_messages.join(', '), status: 'danger' }
    end
    respond_to do |format| 
      @background_color_contrast = helpers.background_color_contrast(@company.header_color_2)
      format.js {}
    end
  end

  def update_gads
    # sleep 3
    puts 'companies#update_gads'
    awesome_print(company_params.to_h)
    company = Company.find(params[:id])
    if company.update(company_params)
      # if company.promote_tr? && ads must be modified (e.g. short headline changed, images removed)
      # end
    else
      @errors = company.errors.full_messages
    end
    respond_to do |format|
      format.js do
        ad_images_params = company_params.to_h[:adwords_images_attributes]
        @saved_image = saved_ad_image(ad_images_params)
        @swapped_default_image = swapped_default_ad_image(ad_images_params)
        @prev_default_image = prev_default_ad_image(ad_images_params)
        image_type = (@saved_image || @swapped_default_image).try(:[], :type)
        @collection = image_type&.split(/(?=[A-Z])/).try(:[], 1)&.downcase.try(:concat, 's') || ''
        @res_data = {
          'savedImage' => @saved_image,
          'swappedDefaultImage' => @swapped_default_image,
          'prevDefaultImage' => @prev_default_image,
          'collection' => @collection,
          'imageType' => image_type,
          # 'cardClassName' => (
          #   @saved_image &&
          #   helpers.ad_image_card_class_name(type: image_type, default: image_type[:default])
          # ),
          'typeClassName' => image_type&.split(/(?=[A-Z])/)&.reverse&.join('--')&.downcase&.sub(/\A/, 'gads-'),
          'removedImageId' => removed_ad_image_id(ad_images_params),
        }
        awesome_print(@res_data)
        @saved_image_card = image_card(@saved_image, @collection)
        @swapped_default_image_card = image_card(@swapped_default_image, @collection)
        @prev_default_image_card = image_card(@prev_default_image, @collection)
        @new_image_card = @saved_image && !@prev_default_image ? image_card({}, @collection) : nil
      end
    end
  end

  def set_reset_gads
    company = Company.find(params[:id])
    if company.ready_for_gads?

      # force to get campaigns by name => because staging won't match production
      campaigns = GoogleAds::get_campaigns([ nil, nil ], company.subdomain)

      # create campaigns if they don't exist on google
      # new_campaigns = nil
      # if campaigns.blank? || campaigns.length < 2
      #   new_campaigns = GoogleAds::create_campaigns(company.subdomain)
      #   new_ad_groups = GoogleAds::create_ad_groups(new_campaigns[:topic][:id], new_campaigns[:retarget][:id])
      # end

      # this will ensure local objects have correct campaign_id/ad_group_id
      company.sync_gads_campaigns

      # remove all ads from google
      company.remove_all_gads
    end
    respond_to do |format|
      format.json do
        render({
          json: {
            # gadsDataIsMissing: gads_data_is_missing,
            requirementsChecklist: company.gads_requirements_checklist,
            publishedStoryIds: company.stories.published.pluck(:id)
          }
        })
      end
    end
  end

  def widget
    @company.plugin.update(plugin_params)
    respond_to { |format| format.js {} }
  end

  # for zapier
  def get_curators
    respond_to do |format|
      format.any do
        render({
          json: current_user.company.curators.to_json({ only: [:id], methods: [:full_name] })
        })
      end
    end
  end

  # for zapier
  def get_invitation_templates
    respond_to do |format|
      format.any do
        render({
          json: current_user.company.invitation_templates.to_json({ only: [:id, :name] })
        })
      end
    end
  end

  private

  def company_params
    params.require(:company).permit(
      :name, :subdomain, :logo_url, :website, :gtm_id,
      :header_color_1, :header_color_2, :header_text_color,
      :adwords_short_headline,
      { adwords_images_attributes: [:id, :type, :image_url, :default, :is_default_card, :_destroy] }
    )
  end

  def plugin_params
    params.require(:plugin)
          .permit(:tab_color, :text_color, :show, :show_delay, :show_freq, :hide, :hide_delay)
  end

  def set_company
    @company = Company.find_by_id(params[:id]) || Company.find_by_subdomain(request.subdomain)
  end

  def user_authorized?
    if current_user.company_id == params[:id].to_i
      true
    else
      render file: 'public/403', status: 403, layout: false
      false
    end
  end

  def set_form_options (params, company=nil)
    options = {
      html: {
        id: 'company-profile-form',
        autocomplete: 'off',
        class: 'directUpload form-horizontal',
        data: {
          url: @s3_direct_post.url,
          host: URI.parse(@s3_direct_post.url).host,
          'form-data' => (@s3_direct_post.fields)
        }
      }
    }
    if params[:action] == 'edit'
      # why auth token? # https://github.com/rails/rails/issues/22807
      options.merge({ url: company_path(company), method: 'put', remote: 'true', authenticity_token: true })
    else  # new
      options.merge({ url: create_company_path })
    end
  end

  def ad_images_removed?(company_params)
    return false if company_params[:adwords_images_attributes].blank?
    company_params[:adwords_images_attributes].any? do |index, attrs|
      attrs[:_destroy] == 'true'
    end
  end

  # returns a hash containing ad/ad_group/campaign data associated with removed images
  def removed_images_ads (company, images_attributes)
    images_attributes
      .select { |index, attrs| attrs['_destroy'] == 'true' }
      .flatten.delete_if { |item| item.is_a?(String) }  # get rid of indices
      .map do |image|
        ads = AdwordsImage.find(image[:id]).ads
        # switch to default image, TODO: also need to push the change to adwords
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
      .delete_if { |image_ads| image_ads[:ads_params].empty? }  # no affected ads
  end

  def image_card(image, collection)
    return nil unless image
    base_locals = { image_index: '?', collection: collection }
    render_to_string(partial: 'adwords_images/ad_image_card', locals: base_locals.merge(ad_image: image))
  end

  def saved_ad_image(ad_images_params)
    new_image = ad_images_params.try(:select) { |index, image| image[:id].blank? }
    new_image = new_image.try(:[], new_image.try(:keys).try(:first))
    if new_image.present?
      AdwordsImage.where(image_url: new_image[:image_url]).take
        &.slice(:id, :type, :image_url, :default)
        &.merge({ did_save: true })
    else
      nil
    end
  end

  def prev_default_ad_image(ad_images_params)
    if ad_images_params.try(:length) == 2
      new_image_is_present = ad_images_params.try(:select) { |i, image| image[:id].blank? }.present?
      key = new_image_is_present ? ad_images_params.keys.last : ad_images_params.keys.first
      AdwordsImage.find(ad_images_params[key][:id])
    else
      nil
    end
  end

  # the swapped-in image (not swapped-out; that's the previous_default)
  def swapped_default_ad_image(images_attrs)
    # no default present, assign one
    if images_attrs.try(:length) == 1 &&
       !removed_ad_image_id(images_attrs) &&
       images_attrs[images_attrs.keys.first][:id].present?
       images_attrs[images_attrs.keys.first][:default] == 'true'
      images_attrs[images_attrs.keys.first]
    # default is present, assign a new one (could be new or existing)
    # if it's new, get the id
    elsif images_attrs.try(:length) == 2 &&
          images_attrs[images_attrs.keys.last][:default] == 'true'
      images_attrs[images_attrs.keys.last][:id].present? ?
        images_attrs[images_attrs.keys.last] :
        new_ad_image(images_attrs)
    else
      nil
    end
  end

  def removed_ad_image_id(images_attrs)
    images_attrs.try(:length) == 1 &&
    images_attrs[images_attrs.keys.first][:_destroy] == 'true' ?
      images_attrs[images_attrs.keys.first][:id] :
      nil
  end

end
