# frozen_string_literal: true

class CompaniesController < ApplicationController
  before_action :set_company, except: %i[new create promote get_curators get_invitation_templates]

  def new
    if current_user&.company.present?
      redirect_to root_url(subdomain: current_user.company.subdomain)
      return
    end
    
    @company = Company.new
    render :edit
  end

  def show
    set_curator
    @workflow_stage = params[:workflow_stage]
    @prospect_tab = cookies['csp-prospect-tab'] || '#customer-wins'
    @promote_tab = cookies['csp-promote-tab'] || '#promoted-stories'
    @measure_tab = cookies['csp-measure-tab'] || '#visitors'
    # @recent_activity = @company.recent_activity(30)
    # @story_views_30_day_count = @company.page_views.story.since(30.days.ago).count
    set_row_group_data_sources
    @filters = filters_from_cookies
    set_visitors_filters
    @filters_match_type = cookies['csp-dashboard-filters-match-type'] || 'all'
    render :dashboard
  end

  def edit
    render :settings
  end

  def create
    @company = Company.new(company_params)
    if @company.save
      @company.curators << current_user
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
    # TODO: handle case of absent primary CTA
    if @company.update company_params
      respond_to do |format|
        format.turbo_stream do
          turbo_stream_actions = []
          
          unless turbo_frame_request_id == 'company-ctas-frame'
            turbo_stream_actions = [
              turbo_stream.replace(
                turbo_frame_request_id,
                partial: frame_partials[turbo_frame_request_id],
                locals: { company: @company }
              )
            ]
          end

          if turbo_frame_request_id == 'company-profile-frame'
            turbo_stream_actions << render_header_logo if updated_square_logo?
            turbo_stream_actions << render_main_cta if updated_main_cta?
          end
           
          flash.now[:notice] = successful_update_flash_message
          turbo_stream_actions << turbo_stream.replace('toaster', partial: 'shared/toaster')
          render turbo_stream: turbo_stream_actions
        end
      end
    else
      render partial: frame_partials[turbo_frame_request_id],
             locals: { company: @company, errors: @company.errors.full_messages },
             layout: false,
             status: :unprocessable_entity
    end
  end

  def ads
    active_collection = params[:company][:active_collection] || 'images'
    if @company.update company_params
      # "Adwords images media can't be blank" => error uploading to s3
      # "Adwords images image_url can't be blank" => error uploading to browser

      flash.now[:notice] =
        if company_params[:adwords_short_headline].present?
          'Headline has been updated'
        elsif company_params[:adwords_images_attributes].values.any? { |ad| ad[:id].blank? }
          'Image has been added'
        elsif company_params[:adwords_images_attributes].values.any? { |ad| ad[:_destroy] == 'true' }
          'Image was deleted'
        else
          'Default image has been updated'
        end
    else
      @errors = @company.errors.full_messages
    end
    render(
      partial: 'companies/dashboard/gads_form',
      locals: { company: @company, errors: @errors, active_collection: }
    )
  end

  def activity
    company = Company.find(params[:id])
    Time.zone = params[:time_zone] || 'UTC'
    respond_to do |format|
      format.json do
        render json: { recent: company.recent_activity(30) }
      end
    end
  end

  def set_reset_gads
    company = Company.find params[:id]
    if company.gads_requirements_checklist.values.all?(&:present?)

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
                 json: current_user.company.invitation_templates.to_json({ only: %i[id name] })
               })
      end
    end
  end

  private

  def company_params
    params.require(:company).permit(
      :id, :name, :subdomain, :website, :logo_url, :square_logo_url, :landscape_logo_url, :gtm_id,
      :header_logo_type, :header_color_1, :header_color_2, :header_text_color,
      :adwords_short_headline,
      ctas_attributes: %i[id position],
      category_tags_attributes: %i[id name _destroy],
      product_tags_attributes: %i[id name _destroy],
      contributor_questions_attributes: %i[id question _destroy],
      adwords_images_attributes: %i[id type image_url default is_default_card _destroy]
    )
  end

  def plugin_params
    params.require(:plugin)
          .permit(:tab_color, :text_color, :show, :show_delay, :show_freq, :hide, :hide_delay)
  end

  def filters_from_cookies
    %i[curator status customer category product].map do |type|
      cookie_val = cookies["csp-#{type}-filter"]
      if cookie_val.blank?
        # Set curator to current_user unless the curator filter was explicitly cleared.
        # It is the only filter that will set a cookie to '' on clear.
        [type, type == :curator && cookie_val.nil? ? current_user.id : nil]
      else
        [type, cookie_val.to_i]
      end
    end.to_h.compact
  end

  def set_row_group_data_sources
    customer_wins = cookies['csp-customer-wins-row-group-data-source']
                    &.match(/\A(?<source>customer\.name|)\z/)
                    &.[](:source)
    contributions =
      cookies['csp-contributions-row-group-data-source']
      &.match(/\A(?<source>contributor\.full_name|customer\.name|customer_win\.name|invitation_template\.name|)\z/)
      &.[](:source)
    promoted_stories = cookies['csp-promoted-stories-row-group-data-source']
                       &.match(/\A(?<source>customer\.name|)\z/)
                       &.[](:source)
    @row_group_data_source = { customer_wins:, contributions:, promoted_stories: }
  end

  def ad_images_removed?(company_params)
    return false if company_params[:adwords_images_attributes].blank?

    company_params[:adwords_images_attributes].any? { |_index, attrs| attrs[:_destroy] == 'true' }
  end

  # returns a hash containing ad/ad_group/campaign data associated with removed images
  def removed_images_ads(company, images_attributes)
    images_attributes
      .select { |index, attrs| attrs['_destroy'] == 'true' }
      .flatten.delete_if { |item| item.is_a?(String) } # get rid of indices
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
      .delete_if { |image_ads| image_ads[:ads_params].empty? } # no affected ads
  end

  def updated_square_logo?
    @company.previous_changes[:square_logo_url].present?
  end

  def render_header_logo
    turbo_stream.update(
      'company-admin-logo',
      html: " \
        <img src=\"#{@company.square_logo_url}\" alt=\"#{@company.name} logo\" />
        <i class=\"fa fa-caret-down\"></i> \
      ".html_safe
    )
  end

  def updated_main_cta?
    @company.previous_changes[:header_color_1].present? && @company.ctas.primary.present?
  end

  def render_main_cta
    turbo_stream.update(
      "edit-cta-#{@company.ctas.primary.take.id}",
      partial: 'ctas/edit', locals: { company: @company, cta: @company.ctas.primary.take }
    )
  end

  def frame_partials
    {
      'company-tags-frame' => 'companies/settings/tags',
      'company-profile-frame' => 'companies/settings/company_profile'
    }
  end

  def successful_update_flash_message
    return '' unless turbo_frame_request?
      
    case turbo_frame_request_id
    when 'company-ctas-frame'
      'CTAs have been reordered'
    when 'company-tags-frame'
      'Tags have been updated'
    when 'company-profile-frame'
      'Account Settings have been updated'
    end
  end
end
