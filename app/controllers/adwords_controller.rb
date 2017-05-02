class AdwordsController < ApplicationController

  require 'adwords_api'
  before_action { @company = Company.find_by(subdomain: request.subdomain) }
  before_action only: [:update] { get_ad_groups(@company) }

  def update_story
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

    # assign adwords_media_id
    # if logo image, or if image was deleted due to not meeting size requirements,
    # it won't be found
    AdwordsImage.find_by(image_url: image_url)
                .try(:update, { adwords_media_id: response[0][:media_id] })

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

  def get_ads(company, type)
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
    result[:entries].select do |ad|
      ad[:labels].any? { |label| label[:name] == company.subdomain } &&
      ad[:labels].any? { |label| label[:name] == type }
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


