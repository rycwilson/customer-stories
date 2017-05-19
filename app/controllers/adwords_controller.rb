class AdwordsController < ApplicationController

  require 'adwords_api'

  before_action() { set_company(params) }
  before_action({ except: [:update_company, :sync_company] }) { set_story(params) }
  before_action({ except: [:preview] }) { create_adwords_api() }
  before_action({ except: [:preview] }) do
    # @promote_enabled = false
    @promote_enabled = @company.promote_tr?
  end

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
          # reload to get the new ad_id
          if @story.ads.reload.all? { |ad| update_ad_status(ad) }
            @flash = { status: 'success',
                         mesg: 'Sponsored Story updated' }
          else
            # @flash for exceptions set in update_ad_status
          end
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

  def update_company
    # ajax request performed a JSON.stringify in order to preserve nested arrays
    if request.format == :js
      params[:company] = JSON.parse(params[:company])
      puts JSON.pretty_generate(params[:company])
    end

    # changes to default image
    @swapped_default_image = params[:company][:swapped_default_image].present?
    @uploaded_default_image = params[:company][:uploaded_default_image].present?

    # for any deleted images, re-create affected ads
    # (affected ads have already been assigned default image)
    # if promote isn't enabled, still need to respond with affected stories for table update
    if params[:company][:removed_images_ads].present?
      # keep track of story ids to update sponsored stories table
      @removed_images_stories = Set.new
      params[:company][:removed_images_ads].each do |image|
        image[:ads_params].each do |ad_params|
          ad = AdwordsAd.includes(:story).find_by(ad_id: ad_params[:ad_id])
          @removed_images_stories << { csp_image_id: ad.adwords_image.id, story_id: ad.story.id }
          if @promote_enabled
            remove_ad(ad_params)
            create_ad(@company, ad.story, ad_params[:campaign_type])
            update_ad_status(ad.reload)  # reload to get the new ad.ad_id
          end
        end
      end
      # every two successive ads (topic and retarget) will be associated with the same story
      # @removed_images_stories.uniq
    end

    if @promote_enabled && new_images?(params[:company])
      get_new_images(params[:company]).each do |image_params|  # { type: , url: }
        upload_image(@company, image_params) or return # return if error
      end
    end

    # company logo or short headline
    if @promote_enabled &&
       ( params[:company].dig(:previous_changes, :adwords_short_headline) ||
         params[:company][:adwords_logo_url] )

      @company.ads.each do |ad|
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
    @short_headline = @company.adwords_short_headline
    @long_headline = @story.ads.long_headline
    @image_url = @story.ads.adwords_image.try(:image_url) ||
                 @company.adwords_images.default.try(:image_url) ||
                 ADWORDS_IMAGE_PLACEHOLDER_URL
    @logo_url = @company.adwords_logo_url || ADWORDS_LOGO_PLACEHOLDER_URL
    render :ads_preview, layout: false
  end

  def sync_company ()
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
    cookies[:workflow_sub_tab] = 'promote-settings'
    redirect_to(company_path(@company), flash: flash)
  end

  # to allow for creating ads from a seeds file, make some methods protected
  # ( can be called as AdwordsController.new::create_ad() )
  public

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
      result[:value].each do |ad_group_ad|
        puts ('New responsive display ad with id %d and short headline %s was ' +
            'added.') % [ad_group_ad[:ad][:id], ad_group_ad[:ad][:short_headline]]
      end
      if campaign_type == 'topic'
        story.topic_ad.update(ad_id: result[:value][0][:ad][:id])
      else  # retarget
        story.retarget_ad.update(ad_id: result[:value][0][:ad][:id])
      end
      # add a story label to the ad
      story_label = get_story_label(story.id.to_s) ||
                    create_story_label(story.id.to_s)
      add_story_label_to_ad(
        result[:value][0][:ad][:id], ad_group_id, story_label[:id]
      )
      return true
    else
      puts "No responsive display ads were added."
      return false
    end
  end

  def remove_ad (ad_params)
    @api ||= create_adwords_api()  # in case method was called from outside controller
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

  def update_ad_status (ad)
    @api ||= create_adwords_api()  # in case method was called from outside controller
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

  def get_images
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
        :number_results => 50
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

  def create_story_label (story_id)  # story_id is a string
    @api ||= create_adwords_api()
    service = @api.service(:LabelService, get_api_version())
    operation = {
      operator: 'ADD',
      operand: {
        xsi_type: 'TextLabel',
        name: story_id
      }
    }
    result = service.mutate([operation])
    result[:value][0]  # return the new label
  end

  def get_story_label (story_id)  # story_id is a string
    @api ||= create_adwords_api()
    service = @api.service(:LabelService, get_api_version())
    selector = {
      fields: ['LabelName'],
      ordering: [ { field: 'LabelName', sort_order: 'ASCENDING' } ],
      paging: { start_index: 0, number_results: 50 },
      predicates: [ { field: 'LabelName', operator: 'IN', values: [story_id] } ]
    }
    result = nil
    begin
      result = service.get(selector)
    rescue AdwordsApi::Errors::ApiException => e
      logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      flash.now[:alert] =
          'API request failed with an error, see logs for details'
    end
    result[:entries].try(:[], 0) || nil
  end

  def add_story_label_to_ad (ad_id, ad_group_id, story_label_id)
    service = @api.service(:AdGroupAdService, get_api_version())
    operation = {
      operator: 'ADD',
      operand: {
        ad_id: ad_id,
        ad_group_id: ad_group_id,
        label_id: story_label_id
      }
    }
    response = service.mutate_label([operation])
    if response and response[:value]
      response[:value].each do |ad_label|
        puts "Story label for ad ID %d and label ID %d was added.\n" %
            [ad_label[:ad_id], ad_label[:label_id]]
      end
    end
  end

end


