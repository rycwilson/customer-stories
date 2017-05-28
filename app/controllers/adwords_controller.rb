class AdwordsController < ApplicationController

  require 'adwords_api'

  before_action() { set_company(params) }
  before_action() { @promote_enabled = @company.promote_tr? }
  before_action({ except: [:update_company, :sync_company] }) { set_story(params) }
  before_action({ except: [:preview] }) { create_adwords_api() }
  after_action({ except: [:preview, :sync_company] }) { flash.discard if request.xhr? }

  def create_story_ads
    if @promote_enabled && @story.ads.all? { |ad| ad.delay.create() }
      flash[:notice] = 'Story published and Sponsored Story created'
    else
      # flash[:alert] set in ad.create_ad
    end
    respond_to { |format| format.js }
  end

  def update_story_ads
    # use .present? to get boolean instead of string
    @image_changed = params[:image_changed].present?
    @status_changed = params[:status_changed].present?
    @long_headline_changed = params[:long_headline_changed].present?

    if @promote_enabled && @status_changed
      if @story.ads.all? { |ad| ad.delay.update_status() }
        flash[:notice] = "Sponsored Story #{@story.ads.enabled? ? 'enabled' : 'paused'}"
      else
        # flash[:alert] for exceptions is set in ad.update_status
      end

    elsif @promote_enabled && (@image_changed || @long_headline_changed)
      if @story.ads.all? { |ad| ad.delay.remove() }
        if @story.ads.all? { |ad| ad.delay.create() }
          # reload to get the new ad_id
          if @story.ads.reload.all? { |ad| ad.delay.update_status() }
            flash[:notice] = 'Sponsored Story updated'
          else
            # flash[:alert] for exceptions set in ad.update_status
          end
        else
          # flash[:alert] for exceptions set in ad.create
        end
      else
        # flash[:alert] for exceptions is set in ad.remove
      end
    end
    respond_to { |format| format.js }
  end

  def remove_story_ads
    if @promote_enabled
      @story.ads.each() { |ad| ad.delay.remove() }
    end
    respond_to { |format| format.json { head :no_content } }
  end

  def update_company
    # ajax request performed a JSON.stringify in order to preserve nested arrays
    if request.format == :js
      params[:company] = JSON.parse(params[:company])
    end

    # changes to default image
    @swapped_default_image = params[:company][:swapped_default_image].present?
    @uploaded_default_image = params[:company][:uploaded_default_image].present?

    ##
    ##  method updates any ads that were affected by a removed image;
    ##  csp changes apply to subscribers and non-subscribers alike;
    ##
    # for any deleted images, update affected ads
    # (this is for subscribers and non-subscribers alike => ad id and ad group id may be nil)
    # (affected ads have already been assigned default image)
    # if promote isn't enabled, still need to respond with affected stories for table update
    if params[:company][:removed_images_ads].present?
      # keep track of story ids to update sponsored stories table
      # every two successive ads (topic and retarget) will be associated with the same story,
      # so put in a Set to prevent duplicates
      @removed_images_stories = Set.new
      params[:company][:removed_images_ads].each do |image|
        image[:ads_params].each do |ad_params|
          ad = AdwordsAd.includes(:story).find(ad_params[:csp_ad_id])
          @removed_images_stories << { csp_image_id: ad.adwords_image.id, story_id: ad.story.id }
          if @promote_enabled
            puts "removing and re-creating ad #{ad.id} associated with destroyed image #{ad_params[:csp_image_id]}..."
            ad.delay.remove()
            ad.delay.create()
            # WAIT ... we can only call update_status after create finishes
            # need a callback!
            ad.reload.delay.update_status()  # reload to get the new ad.ad_id
          end
        end
      end
      @removed_images_stories
    end

    # upload any new images
    if @promote_enabled && new_images?(params[:company])
      get_new_images(params[:company]).each do |image_params|  # { type: , url: }
        upload_image(@company, image_params) or return # return if error
      end
    end

    # update company logo or short headline
    if @promote_enabled &&
       ( params[:company].dig(:previous_changes, :adwords_short_headline) ||
         params[:company][:adwords_logo_url] )

      @company.ads.each() do |ad|
        campaign_type = ad.ad_group.campaign.type == 'TopicCampaign' ? 'topic' : 'retarget'
        ad_params = { ad_id: ad.ad_id, ad_group_id: ad.ad_group.ad_group_id }
        remove_ad(ad_params)
        create_ad(@company, ad.story, campaign_type)
        update_ad_status(ad.reload)  # reload to get the new ad_id
      end
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
    # disable the ad links in production
    @is_production = ENV['HOST_NAME'] == 'customerstories.net'
    @story_url = @story.csp_story_url
    @short_headline = @company.adwords_short_headline
    @long_headline = @story.ads.long_headline
    @image_url = @story.ads.adwords_image.try(:image_url) ||
                 @company.adwords_images.default.try(:image_url) ||
                 ADWORDS_IMAGE_PLACEHOLDER_URL
    @logo_url = @company.adwords_logo_url || ADWORDS_LOGO_PLACEHOLDER_URL
    set_ad_dimensions(@long_headline)
    render :ads_preview, layout: false
  end

  def sync_company
    if @company.ready_for_adwords_sync?
      topic_campaign = get_campaign(@company, 'topic')
      topic_ad_group = get_ad_group(topic_campaign[:id])
      topic_ads = get_ads(topic_ad_group[:id])
      retarget_campaign = get_campaign(@company, 'retarget')
      retarget_ad_group = get_ad_group(retarget_campaign[:id])
      retarget_ads = get_ads(retarget_ad_group[:id])
      @company.sync_with_adwords(
        topic_campaign, topic_ad_group, topic_ads,
        retarget_campaign, retarget_ad_group, retarget_ads
      )
      flash = { success: "Successfully synced with AdWords" }
    else
      flash = { danger: "Company not ready for syncing with AdWords" }
    end
    cookies[:workflow_tab] = 'promote'
    cookies[:workflow_sub_tab] = 'sponsored-stories'
    redirect_to(company_path(@company), flash: flash)
  end

  # to allow for creating ads from a seeds file, make some methods protected
  # ( can be called as AdwordsController.new::create_ad() )
  public

  def get_images
    @api ||= create_adwords_api()  # in case method was called from outside controller
    service = @api.service(:MediaService, get_api_version())
    # Get all the images and videos.
    selector = {
      :fields => ['MediaId', 'Height', 'Width', 'MimeType', 'Urls'],
      :ordering => [
        {:field => 'MediaId', :sort_order => 'ASCENDING'}
      ],
      :predicates => [
        {:field => 'Type', :operator => 'IN', :values => ['IMAGE', 'VIDEO']}
      ],
      :paging => {
        :start_index => 0,
        :number_results => 150
      }
    }

    begin
      result = service.get(selector)
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
    if result[:entries]
      result[:entries].each do |entry|
        full_dimensions = entry[:dimensions]['FULL']
        puts "Entry ID %d dimensions %dx%d MIME type '%s' url '%s'" %
            [entry[:media_id], full_dimensions[:height],
             full_dimensions[:width], entry[:mime_type], entry[:urls]['FULL']]
      end
    end
    if result.include?(:total_num_entries)
      puts "\tFound %d entries." % result[:total_num_entries]
    end
  end

  def get_api_version ()
    :v201702
  end

  # Creates an instance of AdWords API class. Uses a configuration file and
  # Rails config directory.
  def create_adwords_api ()
    if ENV['ADWORDS_ENV'] == 'test'
      config_file = File.join(Rails.root, 'config', 'adwords_api_test.yml')
    elsif ENV['ADWORDS_ENV'] == 'production'
      config_file = File.join(Rails.root, 'config', 'adwords_api_prod.yml')
    end
    @api = AdwordsApi::Api.new(config_file)
  end

  def get_campaign (company, campaign_type)
    @api ||= create_adwords_api()  # in case method was called from outside controller
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
      campaign[:labels].any? { |label| label[:name] == campaign_type }
    end
  end

  def get_ad_group (campaign_id)
    @api ||= create_adwords_api()  # in case method was called from outside controller
    service = @api.service(:AdGroupService, get_api_version())
    selector = {
      fields: ['Id', 'Name', 'Status'],
      ordering: [ { field: 'Id', sort_order: 'ASCENDING' } ],
      paging: { start_index: 0, number_results: 50 },
      predicates: [ { field: 'CampaignId', operator: 'IN', values: [campaign_id] } ]
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

  def get_ads (ad_group_id)
    @api ||= create_adwords_api()  # in case method was called from outside controller
    service = @api.service(:AdGroupAdService, get_api_version())
    selector = {
      fields: ['Id', 'Name', 'Status', 'LongHeadline', 'Labels'],
      ordering: [{ field: 'Id', sort_order: 'ASCENDING' }],
      paging: { start_index: 0, number_results: 50 },
      predicates: [ { field: 'AdGroupId', operator: 'IN', values: [ad_group_id] } ]
    }
    result = nil
    begin
      result = service.get(selector)
    rescue AdwordsApi::Errors::ApiException => e
      logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      flash.now[:alert] =
        'API request failed with an error, see logs for details'
    end
    result[:entries]
  end

  def upload_image (company, image_params)
    @api ||= create_adwords_api()  # in case method was called from outside controller
    service = @api.service(:MediaService, get_api_version())
    # if image_url is nil: Invalid URL: #<ActionDispatch::Http::UploadedFile:0x007f8615701348>
    img_url = image_params[:url]
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
      AdwordsImage.find_by(image_url: image_params[:url]).destroy
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
      AdwordsImage.find_by(image_url: image_params[:url]).destroy
      cookies[:workflow_tab] = 'promote'
      cookies[:workflow_sub_tab] = 'promote-settings'
      redirect_to(company_path(@company), flash: { danger: flash_mesg }) and return
    end

    # assign adwords media_id
    if image_params[:type] == 'logo'
      company.update(adwords_logo_media_id: response[0][:media_id])
    elsif (image_params[:type] == 'landscape')
      AdwordsImage.find_by(image_url: image_params[:url])
                  .update(media_id: response[0][:media_id])
    end

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

  def new_images? (company_params)
    company_params[:adwords_logo_url].present? ||
    company_params[:default_adwords_image_url].present? ||
    company_params[:adwords_images_attributes].try(:any?) do |index, attrs|
      attrs.include?('image_url')
    end
  end

  def get_new_images (company_params)
    new_images = []
    if company_params[:adwords_logo_url].present?
      new_images << { type: 'logo', url: company_params[:adwords_logo_url] }
    end
    if company_params[:default_adwords_image_url].present?
      new_images << { type: 'landscape', url: company_params[:default_adwords_image_url] }
    end
    if company_params[:adwords_images_attributes].present?
      company_params[:adwords_images_attributes]
        .select { |index, attrs| attrs[:image_url].present? }
        .each { |index, attrs| new_images << { type: 'landscape', url: attrs[:image_url] } }
    end
    new_images
  end


  # padding for the lower half is 25px 11px
  # "*_minus_padding" means minus 25x2 = 50
  def set_ad_dimensions (long_headline)
    case @long_headline.length
    when 0..29
      @text_horizontal_container_left = '500px'
      @text_horizontal_container_right = '400px'
    when 30..39
      @text_horizontal_container_left = '480px'
      @text_horizontal_container_right = '420px'
    when 40..49
      @text_horizontal_container_left = '460px'
      @text_horizontal_container_right = '440px'
    when 50..59
      @text_horizontal_container_left = '400px'
      @text_horizontal_container_right = '500px'
    when 60..69
      @text_horizontal_container_left = '380px'
      @text_horizontal_container_right = '520px'
    when 70..90
      @text_horizontal_container_left = '340px'
      @text_horizontal_container_right = '560px'
    end

    # these numbers (except the last) are taken straight from a google ad preview
    @text_vertical_outer_height_top = '214px'
    @text_vertical_inner_height_top = '180px'  # hacked from 181 to make a correction
    @text_vertical_outer_height_bottom = '334px'
    @text_vertical_inner_height_bottom = '300px'  # hacked from 301 to make a correction
    @text_vertical_inner_height_bottom_minus_padding = '251px'  # 25px x 2

    case @long_headline.length
    when 0..25
      @text_square_top_height = '110px'
      @text_square_top_padding = '0'
      @text_square_top_height_minus_padding = '100px'  # minus padding x2, minus 10px to account for padding around the text
      @text_square_top_font_size = '38px'
      @text_square_top_line_height = '40px'
      @text_square_middle_height_outer = '85px'
      @text_square_middle_height_inner =  '59px'
      @text_square_middle_height_minus_padding = '36px'
      @text_square_middle_line_height = '31px'
      @text_square_bottom_font_size = '15px'
    when 26..79
      @text_square_top_height = '85px'
      @text_square_top_padding = '5px 0'
      @text_square_top_height_minus_padding = '65px'  # minus padding x2, minus 10px to account for padding around the text
      @text_square_top_font_size = '31px'
      @text_square_top_line_height = '34px'
      @text_square_middle_height_outer = '109px'
      @text_square_middle_height_inner = '83px'
      @text_square_middle_height_minus_padding = '73px'
      @text_square_middle_line_height = '26px'
      @text_square_bottom_font_size = '13px'
    when 80..90
      @text_square_top_height = '66px'
      @text_square_top_padding = '15px 0'
      @text_square_top_height_minus_padding = '26px'  # minus padding x2, minus 10px to account for padding around the text
      @text_square_top_font_size = '26px'
      @text_square_top_line_height = '26px'
      @text_square_middle_height_outer = '131px'
      @text_square_middle_height_inner = '105px'
      @text_square_middle_height_minus_padding = '95px'
      @text_square_middle_line_height = '24px'
      @text_square_bottom_font_size = '12px'
    end

  end

end


