class AdwordsController < ApplicationController

  require 'adwords_api'
  before_action { @company = Company.find_by(subdomain: request.subdomain) }

  def update_story
    @story = Story.includes(:adwords_config, :adwords_image).find( params[:story_id] )
    @image_changed = params[:image_changed].present? ? true : false
    @status_changed = params[:status_changed].present? ? true : false
    @long_headline_changed = !(@image_changed || @status_changed)

    # ads = get_ads(@company)
    # topic_ad = get_story_ad( story.adwords_config.topic_ad_id )
    # retarget_ad = get_story_ad( story.adwords_config.retarget_ad_id )
    if @image_changed
      # update_ad_image( story, topic_ad )
      # update_ad_image( story, retarget_ad )
    elsif @status_changed
      # update_ad_

    elsif @long_headline_changed

    end

    @flash_status = "success"
    if @status_changed
      @flash_mesg = "Sponsored Story #{@story.adwords_config.enabled ? 'enabled' : 'paused'}"
    else
      @flash_mesg = "Sponsored Story updated"
    end
    respond_to { |format| format.js }
  end

  def update_company
    if new_images?(params[:company])
      get_new_image_urls(params[:company]).each do |image_url|
        upload_image(image_url) or return
      end
    end
    respond_to do |format|
      format.html do
        cookies[:workflow_tab] = 'promote'
        cookies[:workflow_sub_tab] = 'promote-settings'
        redirect_to(company_path(@company), flash: { success: "Sponsored Stories updated" })
      end
      format.js {}
    end
  end

  def preview
    story = Story.find(params[:id])
    @short_headline = "#{@company.name} Customer Stories"
    @long_headline = story.adwords_config.long_headline
    @image_url = story.adwords_config.adwords_image.try(:image_url) ||
                 @company.adwords_images.default.try(:image_url) ||
                 ADWORDS_IMAGE_PLACEHOLDER_URL
    @logo_url = @company.adwords_logo_url || ADWORDS_LOGO_PLACEHOLDER_URL
    render :ads_preview, layout: false
  end

  def data
    # @type = params[:type]
    # story = Story.find_by(title: params[:story_title])

    # @topic_campaign = get_campaign(@company, 'topic')
    # @retarget_campaign = get_campaign(@company, 'retarget')

    # @topic_ad_group = get_ad_group(@company, 'topic')
    # @retarget_ad_group = get_ad_group(@company, 'retarget')

    # @topic_ads = get_ads(@company, 'topic')
    # @retarget_ads = get_ads(@company, 'retarget')


    respond_to { |format| format.js }
  end

  private

  def get_api_version()
    :v201702
  end

  def get_adwords_api()
    @api ||= create_adwords_api()
  end

  # Creates an instance of AdWords API class. Uses a configuration file and
  # Rails config directory.
  def create_adwords_api()
    config_file = File.join(Rails.root, 'config', 'adwords_api.yml')
    @api = AdwordsApi::Api.new(config_file)
  end

  def get_campaign(company, type)
    service = api.service(:CampaignService, get_api_version())
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
    api = get_adwords_api()
    service = api.service(:AdGroupService, get_api_version())
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

  def upload_image(image_url)
    api = get_adwords_api()
    media_srv = api.service(:MediaService, get_api_version())
    img_url = image_url
    img_data = AdsCommon::Http.get(img_url, api.config)
    base64_image_data = Base64.encode64(img_data)
    image = {
      :xsi_type => 'Image',
      :data => base64_image_data,
      :type => 'IMAGE'
    }

    begin
      response = media_srv.upload([image])

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
    end
    return true
  end

  def get_story_ad (ad_id)
    api = get_adwords_api()
    service = api.service(:AdGroupAdService, get_api_version())
    selector = {
      :fields => ['Id', 'Name', 'Status', 'Labels'],
      :ordering => [{:field => 'Id', :sort_order => 'ASCENDING'}],
      :predicates => [ { field: 'Id', operator: 'IN', values: [ ad_id ] }],
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
    result[:entries][0]
  end

  def get_ads (company)
    api = get_adwords_api()
    service = api.service(:AdGroupAdService, get_api_version())
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
    return result[:entries].select do |ad|
             ad[:labels].try(:any?) { |label| label[:name] == company.subdomain }
           end || []
  end

  # in progress - not working
  def update_ad_image (story, ad)
    api = get_adwords_api()
    service = api.service( :AdGroupAdService, get_api_version() )
    # Prepare operation for updating ad

    responsive_display_ad = {
      :id => ad[:ad][:id],
      :xsi_type => 'ResponsiveDisplayAd',
      # This ad format does not allow the creation of an image using the
      # Image.data field. An image must first be created using the MediaService,
      # and Image.mediaId must be populated when creating the ad.
      :marketing_image => {
        :media_id => story.adwords_image.media_id
      }
    }

    responsive_display_ad_group_ad = {
      :ad_group_id => ad[:ad_group_id],
      :ad => responsive_display_ad,
      # Additional propertires (non-required).
      :status => story.adwords_config.enabled ? 'ENABLED' : 'PAUSED'
    }

    responsive_display_ad_group_ad_operation = {
      :operator => 'SET',
      :operand => responsive_display_ad_group_ad
    }

    # operation = {
    #   operator: 'SET',
    #   operand: {
    #     ad_group_id: ad[:ad_group_id],
    #     ad: {
    #       id: ad[:ad][:id],
    #     image: { media_id: story.adwords_image.media_id }
    #   }
    #   }
    # }
    # Update ad.
    response = service.mutate([responsive_display_ad_group_ad_operation])
    if response and response[:value]
      ad = response[:value].first
      puts "Ad ID %d was successfully updated, status set to '%s'." %
          [ad[:ad][:id], ad[:status]]
    else
      puts 'No ads were updated.'
    end
  end

  def new_images?(company_params)
    company_params[:adwords_logo_url].present? ||
    company_params[:default_adwords_image].present? ||
    company_params[:adwords_images_attributes].any? do |index,atts|
      atts.include?('image_url')
    end
  end

  def get_new_image_urls(company_params)
    (company_params[:adwords_logo_url].try(:split) || []) +
    (company_params[:default_adwords_image].try(:split) || []) +
    (company_params[:adwords_images_attributes] || [])
      .select { |index, atts| atts['image_url'].present? }
      .to_a.map { |image| image[1]['image_url'] }
  end


end


