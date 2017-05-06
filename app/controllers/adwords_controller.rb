class AdwordsController < ApplicationController

  require 'adwords_api'

  before_action do
    @company = Company.find_by( subdomain: request.subdomain )
    get_adwords_api()
  end

  def create_story_ads
  end

  def update_story_ads
    # puts JSON.pretty_generate params
    @story = Story.includes(adwords_ads: { adwords_image: {} }).find( params[:id] )
    @image_changed = params[:image_changed].present?
    @status_changed = params[:status_changed].present?
    @long_headline_changed = !(@image_changed || @status_changed)

    # ads = get_ads(@company)
    # topic_ad = get_ad( story.topic_ad.id )
    # retarget_ad = get_ad( story.retarget_ad.id )
    if @image_changed
      puts 'UPDATE IMAGE'
      # update_ad_image( story, topic_ad )
      # update_ad_image( story, retarget_ad )
    elsif @status_changed
      puts 'UPDATE STATUS'
      # update_ad_status( @story )

    elsif @long_headline_changed
      puts 'UPDATE LONG HEADLINE'

    end

    @flash_status = "success"
    if @status_changed
      @flash_mesg = "Sponsored Story #{@story.ads.enabled? ? 'enabled' : 'paused'}"
    else
      @flash_mesg = "Sponsored Story updated"
    end
    respond_to { |format| format.js }
  end

  def update_company
    puts JSON.pretty_generate params
    # binding.remote_pry
    # 1 - upload all new images (logo, default, additional)
    # 2 - update all ads if logo or short headline changed
    # 3 - update affected ads if default image changed
    # changes = params[:company][:previous_changes]
    # upload any new images (including logo and default landscape)

    if new_images?(params[:company])
      get_new_image_urls(params[:company]).each do |image_url|
        # upload_image(image_url) or return # return if error
      end
    end

    # async update
    if params[:company].dig(:previous_changes, :adwords_short_headline)
      puts 'UPDATE SHORT HEADLINE'
    end

    # only with sync update
    if params[:company][:adwords_logo_url]
      puts 'UPDATE LOGO'
    end

    # sync or async update
    if ( @default_image_changed =
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
    story = Story.find( params[:id] )
    @short_headline = @company.adwords_short_headline
    @long_headline = story.ads.long_headline
    @image_url = story.ads.adwords_image.try(:image_url) ||
                 @company.adwords_images.default.try(:image_url) ||
                 ADWORDS_IMAGE_PLACEHOLDER_URL
    @logo_url = @company.adwords_logo_url || ADWORDS_LOGO_PLACEHOLDER_URL
    render :ads_preview, layout: false
  end

  def data
    @topic_campaign = get_campaign(@company, 'topic')
    @retarget_campaign = get_campaign(@company, 'retarget')

    @topic_ad_group = get_ad_group(@company, 'topic')
    @retarget_ad_group = get_ad_group(@company, 'retarget')

    @ads = get_ads(@company)

    # puts JSON.pretty_generate(@topic_campaign)
    # puts JSON.pretty_generate(@retarget_campaign)

    puts JSON.pretty_generate(@topic_ad_group)
    puts JSON.pretty_generate(@retarget_ad_group)

    # puts JSON.pretty_generate(@ads)

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

  def upload_image(image_url)
    media_srv = @api.service(:MediaService, get_api_version())
    # if image_url is nil: Invalid URL: #<ActionDispatch::Http::UploadedFile:0x007f8615701348>
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

  def get_ad (ad_id)
    service = @api.service(:AdGroupAdService, get_api_version())
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
    service = @api.service(:AdGroupAdService, get_api_version())
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
        :media_id => story.ads.adwords_image.media_id
      }
    }

    responsive_display_ad_group_ad = {
      :ad_group_id => ad[:ad_group_id],
      :ad => responsive_display_ad,
      # Additional propertires (non-required).
      :status => story.ads.enabled ? 'ENABLED' : 'PAUSED'
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
    #     image: { media_id: story.ads.adwords_image.media_id }
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

  def update_ad_status story
    service = @api.service( :AdGroupAdService, get_api_version() )
    # Prepare operation for updating ad.
    story.ads.each do |ad|

      begin

      # Prepare operation for updating ad.
      operation = {
       :operator => 'SET',
       :operand => {
         :ad_group_id => ad.adwords_ad_group_id,
         :status => story.ads.enabled? ? 'ENABLED' : 'PAUSED',
         :ad => {:id => ad.ad_id}
       }
      }

      # Update ad.
      response = service.mutate([operation])
      if response and response[:value]
        ad = response[:value].first
        puts "Ad ID %d was successfully updated, status set to '%s'." %
            [ad[:ad][:id], ad[:status]]
      else
        puts 'No ads were updated.'
      end

      # Authorization error.
      rescue AdsCommon::Errors::OAuth2VerificationRequired => e
        puts "Authorization credentials are not valid. Edit adwords_api.yml for " +
            "OAuth2 client ID and secret and run misc/setup_oauth2.rb example " +
            "to retrieve and store OAuth2 tokens."
        puts "See this wiki page for more details:\n\n  " +
            'https://github.com/googleads/google-api-ads-ruby/wiki/OAuth2'

      # HTTP errors.
      rescue AdsCommon::Errors::HttpError => e
        puts "HTTP Error: %s" % e

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
      end
    end
  end

  def new_images?(company_params)
    company_params[:adwords_logo_url].present? ||
    company_params[:default_adwords_image_url].present? ||
    company_params[:adwords_images_attributes].try(:any?) do |index,atts|
      atts.include?('image_url')
    end
  end

  def get_new_image_urls(company_params)
    (company_params[:adwords_logo_url].try(:split) || []) +
    (company_params[:default_adwords_image_url].try(:split) || []) +
    (company_params[:adwords_images_attributes] || [])
      .select { |index, atts| atts['image_url'].present? }
      .to_a.map { |image| image[1]['image_url'] }
  end

end


