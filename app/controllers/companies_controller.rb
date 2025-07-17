# frozen_string_literal: true

class CompaniesController < ApplicationController
  before_action :set_company, except: %i[new create promote get_curators get_invitation_templates]
  before_action(only: %i[visitors activity]) { Time.zone = params[:time_zone] || 'UTC' }

  def new
    @company = Company.new
    render :edit
  end

  def show
    @curator_id = preselected_curator_id(@company)
    @workflow_stage = params[:workflow_stage]
    @prospect_tab = cookies['csp-prospect-tab'] || '#customer-wins'
    @promote_tab = cookies['csp-promote-tab'] || '#promoted-stories'
    @measure_tab = cookies['csp-measure-tab'] || '#visitors'
    # @recent_activity = @company.recent_activity(30)
    # @story_views_30_day_count = @company.page_views.story.since(30.days.ago).count
    @filters = filters_from_cookies
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
      flash.now[:notice] = 'Account settings have been updated'
      respond_to do |format|
        format.turbo_stream do
          turbo_stream_actions = [
            turbo_stream.replace('toaster', partial: 'shared/toaster'),
            turbo_stream.replace(
              'company-profile-form',
              partial: 'companies/settings/company_profile', locals: { company: @company }
            )
          ]
          if @company.previous_changes[:square_logo_url].present?
            turbo_stream_actions << turbo_stream.update(
              'company-admin-logo',
              html: " \
                <img src=\"#{@company.square_logo_url}\" alt=\"#{@company.name} logo\" />
                <i class=\"fa fa-caret-down\"></i> \
              ".html_safe
            )
          end
          if @company.previous_changes[:header_color_1].present? && @company.ctas.primary.present?
            turbo_stream_actions << turbo_stream.update(
              "edit-cta-#{@company.ctas.primary.take.id}",
              partial: 'ctas/edit', locals: { company: @company, cta: @company.ctas.primary.take }
            )
          end
          render(turbo_stream: turbo_stream_actions)
        end
      end
    else
      @errors = @company.errors.full_messages
    end
  end

  def tags
    if @company.update company_params
      flash.now[:notice] = 'Story tags have been updated'
    else
      # TODO: What about tags errors?
      @errors = @company.errors.full_messages
    end
    render(partial: 'companies/settings/tags', locals: { company: @company, errors: @errors })
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

  # TODO: Why was this called "Landing"? It's just a % of overall visitors
  # "#{((story.visitors.to_f / company.visitors.count) * 100).round(1)}%",
  def visitors
    company = Company.find(params[:id])
    # company = Company.find_by_subdomain 'varmour'
    by_story = Visitor.to_company_by_story(company.id).map do |result|
      [result.customer, result.story, result.visitors]
    end
    by_date = Visitor.to_company_by_date(
      company.id,
      story: params[:story_id],
      start_date: params[:start_date],
      end_date: params[:end_date]
    )
    respond_to do |format|
      format.json do
        render json: { by_story:, by_date: }
      end
    end
  end

  def activity
    company = Company.find(params[:id])
    # company = Company.find_by_subdomain 'varmour'
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
      :name, :subdomain, :website, :logo_url, :square_logo_url, :landscape_logo_url, :gtm_id,
      :header_logo_type, :header_color_1, :header_color_2, :header_text_color,
      :adwords_short_headline,
      story_categories_attributes: %i[id name _destroy],
      products_attributes: %i[id name _destroy],
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

  def preselected_curator_id(company)
    if cookies['csp-curator-id']
      if cookies['csp-curator-id'].blank?
        nil
      else
        company.curators.exists?(cookies['csp-curator-id']) ? cookies['csp-curator-id'].to_i : current_user.id
      end
    else
      current_user.id
    end
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
end
