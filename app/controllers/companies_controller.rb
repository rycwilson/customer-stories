class CompaniesController < ApplicationController

  before_action :authenticate_user!, only: [:show]
  # application#check_subdomain takes care of this...
  # before_action :user_authorized?, only: [:edit, :show]
  before_action :set_company, except: [:new, :create, :promote, :get_curators, :get_invitation_templates]
  before_action :set_s3_direct_post, only: [:new, :show, :create, :update]

  def new
    @company = Company.new
    render :edit
  end

  def show
    @curator_id = preselected_curator_id(@company)
    @workflow_stage = params[:workflow_stage]
    @prospect_tab = cookies['csp-prospect-tab'] || '#customer-wins'
    @promote_tab = cookies['csp-promote-tab'] || '#promoted-stories'
    @measure_tab = cookies['csp-measure-tab'] || '#story-visitors'
    # @recent_activity = @company.recent_activity(30)
    # @story_views_30_day_count = PageView.joins(:visitor_session).company_story_views_since(@company.id, 30).count
    @filters = %i(curator status customer category product).map do |type| 
      # curator is the only field that will set a cookie to '' on clear (to override the default of current_user.id)
      cookie_val = cookies["csp-#{type}-filter"]
      if cookie_val.blank?
        # set curator to current_user unless the curator filter was explicitly cleared
        [type, (type == :curator && cookie_val.nil?) ? current_user.id : nil]
      else
        [type, cookie_val.to_i]
      end
    end.to_h.compact
    @filters_match_type = cookies['csp-dashboard-filters-match-type'] || 'all'
  end

  def edit
  end

  def create
    @company = Company.new(company_params)
    if @company.save
      @company.users << current_user
      session['authorized_subdomains'] = ['', @company.subdomain]
      redirect_to edit_company_url(subdomain: @company.subdomain), flash: { notice: 'Company registered successfully' }
    else
      # validation(s): presence / uniqueness of name, presence of subdomain
      flash.now[:danger] = @company.errors.full_messages.join(', ')
      # redirect_to(register_company_path)
      render :edit
    end

  end

  def update
    if @company.update(company_params)
      if turbo_frame_request_id == 'company-story-tags'
        flash.now[:notice] = 'Story tags have been updated'
        render(partial: 'companies/settings/story_tags', locals: { company: @company,  })
      elsif turbo_frame_request_id == 'company-ads-settings'
        image_was_created = company_params[:adwords_images_attributes].to_h.any? { |index, ad| ad[:id].blank? } 
        image_was_destroyed = company_params[:adwords_images_attributes].to_h.any? { |index, ad| ad[:_destroy] == 'true' }
        flash.now[:notice] = image_was_created ? 'Image has been added' : (image_was_destroyed ? 'Image was deleted' : 'Default image has been updated')
        render(
          partial: 'companies/dashboard/gads_form', 
          locals: { company: @company, active_collection: params[:company][:active_collection] || 'images' }
        )
      else
        # TODO: handle case of absent primary CTA
        flash.now[:notice] = 'Account settings have been updated'
        respond_to do |format|
          format.turbo_stream do 
            turbo_stream_actions = [
              turbo_stream.replace(
                'toaster', 
                html: "<div id=\"toaster\" data-controller=\"toast\" data-toast-flash-value='#{flash.to_h.to_json}'></div>".html_safe
              ),
              turbo_stream.replace(
                'company-profile-form', 
                partial: 'companies/settings/company_profile', locals: { company: @company }
              )     
            ]
            if @company.previous_changes[:square_logo_url].present?
              turbo_stream_actions << turbo_stream.update(
                'company-admin-logo', 
                html: "<img src=\"#{@company.square_logo_url}\" alt=\"#{@company.name} logo\"><i class=\"fa fa-caret-down\"></i>".html_safe
              )
            end
            if @company.previous_changes[:header_color_1].present? and @company.ctas.primary.present?
              turbo_stream_actions << turbo_stream.update(
                "edit-cta-#{@company.ctas.primary.id}",
                partial: 'ctas/edit', locals: { company: @company, cta: @company.ctas.primary }
              )
            end
            render(turbo_stream: turbo_stream_actions)
          end
        end
      end
    else
      # "Adwords images media can't be blank" => error uploading to s3
      # "Adwords images image_url can't be blank" => error uploading to browser
      puts @company.errors.full_messages
      # @flash = { mesg: @company.errors.full_messages.join(', '), status: 'danger' }
    end
  end

  def set_reset_gads
    company = Company.find(params[:id])
    if company.ready_for_gads?

      # force to get campaigns by name => because staging won't match production
      # campaigns = GoogleAds::get_campaigns([ nil, nil ], company.subdomain)

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
      :name, 
      :subdomain, 
      :website,
      :logo_url,
      :square_logo_url,
      :landscape_logo_url,
      :gtm_id,
      :header_logo_type,
      :header_color_1, 
      :header_color_2, 
      :header_text_color, 
      :adwords_short_headline,
      story_categories_attributes: [:id, :name, :_destroy],
      products_attributes: [:id, :name, :_destroy],
      adwords_images_attributes: [:id, :type, :image_url, :default, :is_default_card, :_destroy]
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

  def preselected_curator_id company
    if cookies['csp-curator-id']
      unless cookies['csp-curator-id'].blank? 
        company.curators.exists?(cookies['csp-curator-id']) ? cookies['csp-curator-id'].to_i : current_user.id
      else
        nil
      end
    else
      current_user.id
    end
  end

  def set_form_options(params, company=nil)
    options = {
      html: {
        id: 'company-profile-form',
        autocomplete: 'off',
        class: 'directUpload form-horizontal',
        data: {
          url: @s3_direct_post.url,
          host: URI.parse(@s3_direct_post.url).host,
          asset_host: Rails.application.config.asset_host,
          s3_data: @s3_direct_post.fields
        }
      }
    }
    if params[:action] == 'edit'
      # why auth token? # https://github.com/rails/rails/issues/22807
      options.merge({ url: company_path(company), method: 'PUT', remote: 'true', authenticity_token: true })
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

  def image_card(image, collection, is_form_input=true)
    return nil unless image
    base_locals = { image_index: is_form_input ? '?' : nil, collection: collection }
    render_to_string(partial: 'adwords_images/ad_image_card', locals: base_locals.merge(ad_image: image))
  end

  def saved_ad_image(_params)
    new_image = _params&.select { |index, image| image[:id].blank? }
    new_image = new_image.try(:[], new_image&.keys&.first)
    if new_image.present?
      AdwordsImage.where(image_url: new_image[:image_url]).take
        &.slice(:id, :type, :image_url, :default)
        &.merge({ did_save: true })
    else
      nil
    end
  end

  # the swapped out default image
  # this one has to be looked up in the db because the client does not preserve its type and image_url
  def prev_default_ad_image(_params)
    if _params&.length == 2
      new_image_is_present = _params&.select { |i, image| image[:id].blank? }.present?
      key = new_image_is_present ? _params.keys.last : _params.keys.first
      AdwordsImage.find(_params[key][:id])
    else
      nil
    end
  end

  # the swapped in default image
  # no need to look up in the db, all needed info is in the params
  def swapped_default_ad_image(_params)
    default_is_blank = _params&.length == 1 && !removed_ad_image_id(_params) && _params[_params.keys.first][:id].present?
    default_is_present = _params&.length == 2 && _params[_params.keys.last][:default] == 'true'
    if default_is_blank
      _params[_params.keys.first]
    elsif default_is_present
      _params[_params.keys.last]
    else
      nil
    end
  end

  def removed_ad_image_id(_params)
    _params.try(:length) == 1 &&
    _params[_params.keys.first][:_destroy] == 'true' ?
      _params[_params.keys.first][:id] :
      nil
  end

end
