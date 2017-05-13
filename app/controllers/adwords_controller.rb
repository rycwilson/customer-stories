class AdwordsController < ApplicationController

  require 'adwords_api'

  before_action() { set_company(params) }
  before_action({ except: [:update_company, :data] }) { set_story(params) }
  before_action({ except: [:preview] }) { create_adwords_api() }
  before_action({ except: [:preview, :data] }) { @promote_enabled = @company.promote_tr? }

  def create_story_ads
    if @promote_enabled
      ['topic', 'retarget'].each do |campaign_type|
        if create_ad(@company, @story, campaign_type)
          @flash = {
            status: 'success',
            mesg: 'Story published and Sponsored Story created'
          }
        else
          # @flash set in create_ad
        end
      end
    end
    respond_to { |format| format.js }
  end

  def update_story_ads
    # use .present? to get boolean instead of string
    @image_changed = params[:image_changed].present?
    @status_changed = params[:status_changed].present?
    @long_headline_changed = params[:long_headline_changed].present?

    if @promote_enabled && @status_changed
      if @story.ads.all? { |ad| update_ad_status(ad) }
        @flash = {
          status: 'success',
          mesg: "Sponsored Story #{@story.ads.enabled? ? 'enabled' : 'paused'}"
        }
      else
        # @flash for exceptions is set in update_ad_status
      end

    elsif @promote_enabled && (@image_changed || @long_headline_changed)
      if @story.ads.all? do |ad|
        remove_ad({ ad_group_id: ad.ad_group.ad_group_id, ad_id: ad.ad_id })
      end
        if ['topic', 'retarget'].all? do |campaign_type|
          create_ad(@company, @story, campaign_type)
        end
          @flash = { status: 'success',
                       mesg: 'Sponsored Story updated' }
        else
          # @flash for exceptions set in create_ad
        end
      else
        # @flash for exceptions is set in remove_ad
      end
    end
    respond_to { |format| format.js }
  end

  # the ids of removed ads are forwarded via params since they've been removed from csp
  def remove_story_ads
    if @promote_enabled
      if params[:removed_ads].all? { |index, ad_params| remove_ad(ad_params) }
        @flash = { status: 'success',
                     mesg: 'Story unpublished and Sponsored Story removed' }
      else
        # @flash set in remove_ad
      end
    end
    respond_to { |format| format.js }
  end

  # TODO: update all ads if logo or short headline changed
  def update_company
    # ajax request performed a JSON.stringify in order to preserve nested arrays
    if request.format == :js
      params[:company] = JSON.parse(params[:company])
    end

    # for any deleted images, re-create affected ads
    # (affected ads have already been assigned default image)
    # if promote isn't enabled, still need to respond with affected stories for table update
    if params[:company][:removed_images_ads].present?
      # gonna need this
      @default_image_url = @company.adwords_images.default.image_url
      # keep track of story ids to update sponsored stories table
      @removed_images_stories = Set.new
      params[:company][:removed_images_ads].each do |image|
        image[:ads_params].each do |ad_params|
          ad = AdwordsAd.includes(:story).find_by(ad_id: ad_params[:ad_id])
          @removed_images_stories << ad.story.id
          if @promote_enabled
            remove_ad(ad_params)
            create_ad(@company, ad.story, ad_params[:campaign_type])
          end
        end
      end
    end

    if @promote_enabled && new_images?(params[:company])
      get_new_image_urls(params[:company]).each do |image_url|
        upload_image(image_url) or return # return if error
      end
    end

    # async update
    if @promote_enabled && params[:company].dig(:previous_changes, :adwords_short_headline)
      puts 'UPDATE SHORT HEADLINE'
    end

    # only with sync update
    if @promote_enabled && params[:company][:adwords_logo_url]
      puts 'UPDATE LOGO'
    end

    # sync or async update
    if @promote_enabled && ( @default_image_changed =
            params[:company][:default_image_changed] == 'true' ||     # async
            params[:company][:default_adwords_image_url].present? )   # sync
      puts 'UPDATE IMAGE'
    end

    @flash_status = "success"
    @flash_mesg = "Sponsored Stories updated"

    respond_to do |format|
      format.html do
        cookies[:workflow_tab] = 'promote'
        cookies[:workflow_sub_tab] = 'promote-settings'
        redirect_to(company_path(@company), flash: { success: @flash_mesg })
      end
      format.js {}
    end
  end

  def preview
    @short_headline = @company.adwords_short_headline
    @long_headline = @story.ads.long_headline
    @image_url = @story.ads.adwords_image.try(:image_url) ||
                 @company.adwords_images.default.try(:image_url) ||
                 ADWORDS_IMAGE_PLACEHOLDER_URL
    @logo_url = @company.adwords_logo_url || ADWORDS_LOGO_PLACEHOLDER_URL
    render :ads_preview, layout: false
  end

  def data
    # @topic_campaign = get_campaign(@company, 'topic')
    @retarget_campaign = get_campaign(@company, 'retarget')

    # @topic_ad_group = get_ad_group(@company, 'topic')
    @retarget_ad_group = get_ad_group(@company, 'retarget')

    @story = Story.find(7)
    @ads = get_ads(@story)

    # puts JSON.pretty_generate(@topic_campaign)
    puts JSON.pretty_generate(@retarget_campaign)

    # puts JSON.pretty_generate(@topic_ad_group)
    puts JSON.pretty_generate(@retarget_ad_group)

    puts JSON.pretty_generate(@ads)

    respond_to do |format|
      format.json do
        render json: {
          topic_campaign: @topic_campaign,
          retarget_campaign: @retarget_campaign,
          topic_ad_group: @topic_ad_group,
          retarget_ad_group: @retarget_ad_group,
          topic_ads: @topic_ads,
          retarget_ads: @retarget_ads,
        }
      end
    end
  end

  # to allow for creating ads from a seeds file, make some methods protected
  # (can be killed as AdwordsController.new::create_adwords_api)
  public

  def get_api_version ()
    :v201702
  end

  # Creates an instance of AdWords API class. Uses a configuration file and
  # Rails config directory.
  def create_adwords_api ()
    config_file = File.join(Rails.root, 'config', 'adwords_api.yml')
    @api = AdwordsApi::Api.new(config_file)
  end

  def upload_image(image_url)
    service = @api.service(:MediaService, get_api_version())
    # if image_url is nil: Invalid URL: #<ActionDispatch::Http::UploadedFile:0x007f8615701348>
    img_url = image_url
    img_data = AdsCommon::Http.get(img_url, @api.config)
    base64_image_data = Base64.encode64(img_data)
    image = {
      :xsi_type => 'Image',
      :data => base64_image_data,
      :type => 'IMAGE'
    }

    begin
      response = service.upload([image])

    rescue AdsCommon::Errors::HttpError => e
      puts "HTTP Error: %s" % e
      flash_mesg = e.message
      AdwordsImage.find_by(image_url: image_url).destroy
      cookies[:workflow_tab] = 'promote'
      cookies[:workflow_sub_tab] = 'promote-settings'
      redirect_to(company_path(@company), flash: { danger: flash_mesg }) and return

    rescue AdwordsApi::Errors::ApiException => e
      puts "Message: %s" % e.message
      puts 'Errors:'
      e.errors.each_with_index do |error, index|
        puts "\tError [%d]:" % (index + 1)
        error.each do |field, value|
          puts "\t\t%s: %s" % [field, value]
        end
      end
      if e.message.match(/ImageError.UNEXPECTED_SIZE/)
        flash_mesg = "Image does not meet size requirements"
      else
        flash_mesg = e.message
      end
      AdwordsImage.find_by(image_url: image_url).destroy
      cookies[:workflow_tab] = 'promote'
      cookies[:workflow_sub_tab] = 'promote-settings'
      redirect_to(company_path(@company), flash: { danger: flash_mesg }) and return
    end

    # assign adwords media_id
    # if logo image, or if image was deleted due to not meeting size requirements,
    # it won't be found
    AdwordsImage.find_by(image_url: image_url)
                .try(:update, { media_id: response[0][:media_id] })

    if response and !response.empty?
      ret_image = response.first
      full_dimensions = ret_image[:dimensions]['FULL']
      puts ("Image with ID %d, dimensions %dx%d and MIME type '%s' uploaded " +
          "successfully.") % [ret_image[:media_id], full_dimensions[:height],
           full_dimensions[:width], ret_image[:mime_type]]
    else
      puts 'No images uploaded.'
      return false
    end
    return true
  end

  def create_ad (company, story, campaign_type)
    @api ||= create_adwords_api()  # in case method was called from outside controller
    service = @api.service(:AdGroupAdService, get_api_version())
    ad_group_id = campaign_type == 'topic' ?
                  company.campaigns.topic.ad_group.ad_group_id :
                  company.campaigns.retarget.ad_group.ad_group_id

    responsive_display_ad = {
      xsi_type: 'ResponsiveDisplayAd',
      # media_id can't be nil
      logo_image: { media_id: company.adwords_logo_media_id },
      marketing_image: { media_id: story.ads.adwords_image.media_id },
      short_headline: company.adwords_short_headline,
      long_headline: story.ads.long_headline,
      description: story.ads.long_headline,
      business_name: company.adwords_short_headline,
      url_custom_parameters: {  # not allowed in keys: _, -
        parameters: [ { key: 'campaign', value: 'promote' },
                      { key: 'content', value: campaign_type } ]
      },
      final_urls: [ story.csp_story_url + "?utm_campaign={_campaign}&utm_content={_content}" ]
    }
    # Create an ad group ad for the responsive display ad.
    responsive_display_ad_group_ad = {
      ad_group_id: ad_group_id,
      ad: responsive_display_ad,
      # Additional propertires (non-required).
      status: 'PAUSED'
    }
    # Create operation.
    responsive_display_ad_group_ad_operations = {
      operator: 'ADD',
      operand: responsive_display_ad_group_ad
    }

    begin
      result = service.mutate([responsive_display_ad_group_ad_operations])

    # Authorization error.
    rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      if Rails.env.development?
        @flash = { status: 'danger', mesg: 'Invalid Adwords API credentials' }
      else
        @flash = { status: 'danger', mesg: 'Error creating Sponsored Story' }
      end
    # HTTP errors.
    rescue AdsCommon::Errors::HttpError => e
      puts "HTTP Error: %s" % e
      if Rails.env.development?
        @flash = { status: 'danger', mesg: "HTTP error: #{e}" }
      else
        @flash = { status: 'danger', mesg: 'Error creating Sponsored Story' }
      end
    # API errors.
    rescue AdwordsApi::Errors::ApiException => e
      puts "Message: %s" % e.message
      puts 'Errors:'
      e.errors.each_with_index do |error, index|
        puts "\tError [%d]:" % (index + 1)
        error.each do |field, value|
          puts "\t\t%s: %s" % [field, value]
        end
      end
      if Rails.env.development?
        @flash = { status: 'danger', mesg: "Adwords API error: #{e.message}" }
      else
        @flash = { status: 'danger', mesg: 'Error creating Sponsored Story' }
      end
    end

    # on success, log and update adwords_ad.ad_id
    if result && result[:value]
      puts "RESPONSE #{JSON.pretty_generate(result)}"
      result[:value].each do |ad_group_ad|
        puts ('New responsive display ad with id %d and short headline %s was ' +
            'added.') % [ad_group_ad[:ad][:id], ad_group_ad[:ad][:short_headline]]
      end
      if campaign_type == 'topic'
        story.topic_ad.update(ad_id: result[:value][0][:ad][:id])
      else  # retarget
        story.retarget_ad.update(ad_id: result[:value][0][:ad][:id])
      end
      return true
    else
      puts "No responsive display ads were added."
      return false
    end
  end

  def remove_ad (ad_params)
    service = @api.service(:AdGroupAdService, get_api_version())
    operation = {
      operator: 'REMOVE',
      operand: {
        ad_group_id: ad_params[:ad_group_id].to_i,
        ad: {
          xsi_type: 'ResponsiveDisplayAd',
          id: ad_params[:ad_id].to_i
        }
      }
    }
    begin
      response = service.mutate([operation])
    # Authorization error.
    rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      if Rails.env.development?
        @flash = { status: 'danger', mesg: 'Invalid Adwords API credentials' }
      else
        @flash = { status: 'danger', mesg: 'Error removing Sponsored Story' }
      end
    # HTTP errors.
    rescue AdsCommon::Errors::HttpError => e
      puts "HTTP Error: %s" % e
      if Rails.env.development?
        @flash = { status: 'danger', mesg: "HTTP error: #{e}" }
      else
        @flash = { status: 'danger', mesg: 'Error removing Sponsored Story' }
      end
    # API errors.
    rescue AdwordsApi::Errors::ApiException => e
      puts "Message: %s" % e.message
      puts 'Errors:'
      e.errors.each_with_index do |error, index|
        puts "\tError [%d]:" % (index + 1)
        error.each do |field, value|
          puts "\t\t%s: %s" % [field, value]
        end
      end
      if Rails.env.development?
        @flash = { status: 'danger', mesg: "Adwords API error: #{e.message}" }
      else
        @flash = { status: 'danger', mesg: 'Error removing Sponsored Story' }
      end
    end

    if response and response[:value]
      ad = response[:value].first
      puts "Ad ID %d was successfully removed." % ad[:ad][:id]
      return true
    else
      puts 'No ads were removed.'
      return false
    end
  end

  private

  def set_company (params)
    if ['update_company', 'data'].include?(params[:action])
      @company = Company.find(params[:id])
    else
      @company = Company.find_by({ subdomain: request.subdomain })
    end
  end

  def set_story (params)
    if ['create_story_ads', 'remove_story_ads'].include?(params[:action])
      @story = Story.find(params[:id])
    elsif ['update_story_ads', 'preview'].include?(params[:action])
      @story = Story.includes(adwords_ads: { adwords_image: {} }).find(params[:id])
    end
  end

  def get_campaign(company, type)
    service = @api.service(:CampaignService, get_api_version())
    selector = {
      :fields => ['Id', 'Name', 'Status', 'Labels'],
      :ordering => [{:field => 'Id', :sort_order => 'ASCENDING'}],
      :paging => {:start_index => 0, :number_results => 50}
    }
    result = nil
    begin
      result = service.get(selector)
    rescue AdwordsApi::Errors::ApiException => e
      logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      flash.now[:alert] =
          'API request failed with an error, see logs for details'
    end
    result[:entries].find do |campaign|
      campaign[:labels].any? { |label| label[:name] == company.subdomain } &&
      campaign[:labels].any? { |label| label[:name] == type }
    end
  end

  def get_ad_group(company, type)
    service = @api.service(:AdGroupService, get_api_version())
    selector = {
      :fields => ['Id', 'Name', 'Status', 'Labels'],
      :ordering => [{:field => 'Id', :sort_order => 'ASCENDING'}],
      :paging => {:start_index => 0, :number_results => 50}
    }
    result = nil
    begin
      result = service.get(selector)
    rescue AdwordsApi::Errors::ApiException => e
      logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      flash.now[:alert] =
          'API request failed with an error, see logs for details'
    end
    result[:entries].find do |ad_group|
      ad_group[:labels].any? { |label| label[:name] == company.subdomain } &&
      ad_group[:labels].any? { |label| label[:name] == type }
    end
  end

  def get_ad_groups(company)
    @topic_ad_group = get_ad_group(company, 'topic')
    @retarget_ad_group = get_ad_group(company, 'retarget')
  end

  def get_ads (story)
    service = @api.service(:AdGroupAdService, get_api_version())
    selector = {
      fields: ['Id', 'Name', 'Status', 'LongHeadline'],
      ordering: [{ field: 'Id', sort_order: 'ASCENDING' }],
      paging: { start_index: 0, number_results: 50 },
      predicates: [{
        field: 'LongHeadline',
        operator: 'IN',
        values: [ story.title ]
      }],
    }
    result = nil
    begin
      result = service.get(selector)
    rescue AdwordsApi::Errors::ApiException => e
      logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      flash.now[:alert] =
        'API request failed with an error, see logs for details'
    end
  end

  def update_ad_status (ad)
    service = @api.service(:AdGroupAdService, get_api_version())
    operation =  {
      operator: 'SET',
      operand: {
        ad_group_id: ad.ad_group.ad_group_id,
        status: ad.status,
        ad: { id: ad.ad_id }
      }
    }
    begin
      response = service.mutate([operation])

    # Authorization error.
    rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      if Rails.env.development?
        @flash = { status: 'danger', mesg: 'Invalid Adwords API credentials' }
      else
        @flash = { status: 'danger', mesg: 'Error updating Sponsored Story status' }
      end
    # HTTP errors.
    rescue AdsCommon::Errors::HttpError => e
      puts "HTTP Error: %s" % e
      if Rails.env.development?
        @flash = { status: 'danger', mesg: "HTTP error: #{e}" }
      else
        @flash = { status: 'danger', mesg: 'Error updating Sponsored Story status' }
      end
    # API errors.
    rescue AdwordsApi::Errors::ApiException => e
      puts "Message: %s" % e.message
      puts 'Errors:'
      e.errors.each_with_index do |error, index|
        puts "\tError [%d]:" % (index + 1)
        error.each do |field, value|
          puts "\t\t%s: %s" % [field, value]
        end
      end
      if Rails.env.development?
        @flash = { status: 'danger', mesg: "Adwords API error: #{e.message}" }
      else
        @flash = { status: 'danger', mesg: 'Error updating Sponsored Story status' }
      end
    end

    # response
    if response and response[:value]
      adwords_ad = response[:value].first
      puts "Ad ID %d was successfully updated, status set to '%s'." %
          [adwords_ad[:ad][:id], adwords_ad[:status]]
      return true
    else
      puts 'No ads were updated.'
      return false
    end
  end

  def new_images? (company_params)
    company_params[:adwords_logo_url].present? ||
    company_params[:default_adwords_image_url].present? ||
    company_params[:adwords_images_attributes].try(:any?) do |index,atts|
      atts.include?('image_url')
    end
  end

  def get_new_image_urls (company_params)
    (company_params[:adwords_logo_url].try(:split) || []) +
    (company_params[:default_adwords_image_url].try(:split) || []) +
    (company_params[:adwords_images_attributes] || [])
      .select { |index, atts| atts['image_url'].present? }
      .to_a.map { |image| image[1]['image_url'] }
  end

end


