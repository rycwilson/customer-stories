module GoogleAds

  # Here's what an exception looks like when the api is down:
  # [
  #   [0] {
  #     :api_error_type => "InternalApiError",
  #       :error_string => "InternalApiError.UNEXPECTED_INTERNAL_API_ERROR",
  #         :field_path => "",
  #             :reason => "UNEXPECTED_INTERNAL_API_ERROR",
  #            :trigger => "",
  #           :xsi_type => "InternalApiError"
  #   }
  # ]

  require 'adwords_api'
  API_VERSION = :v201809

  class << self

    # this method is used during a set/reset => associated images will already be saved
    def create_story_ads(story)
      return false if story.topic_ad.nil? || story.retarget_ad.nil?
      # return false unless company.promote_tr?
      service = create_api.service(:AdGroupAdService, API_VERSION)
      operations = [story.topic_ad, story.retarget_ad].map do |ad|
        gad = ad.google_ad
        ad_group_ad = {
          ad_group_id: ad.ad_group.ad_group_id,
          ad: gad,
          status: ad.status
        }
        operation = { operator: 'ADD', operand: ad_group_ad }
      end
      new_gads = {}
      begin
        result = service.mutate(operations)
        if result[:value].present?
          result[:value].each do |new_gad|
            campaign_type = (new_gad[:ad_group_id] == story.topic_ad.ad_group.ad_group_id) ? :topic : :retarget
            new_gads[campaign_type] = {
              ad_id: new_gad[:ad][:id],
              long_headline: new_gad[:ad][:long_headline][:asset][:asset_text]
            }
            puts "***\n*** Created responsive display ad (#{campaign_type})\n***"
            log_result([ new_gad[:ad] ])
          end
        else
          # should be exception; why here?
          new_gad[:errors] = ["unknown"]
        end
      rescue Exception => e
        new_gads[:errors] = e.errors.map do |error|
          {
            type: error[:error_string].split('.').last,
            field: error[:field_path].split('.').last
          }
        end
        puts "***\n*** Failed to create responsive display ad for story:"
        puts "*** #{story.title}\n***"
        awesome_print(new_gads[:errors])
      end
      new_gads
    end

    # this method is called from an AdwordsAd before_create callback
    # => always a new ad
    def create_ad(ad)
      service = create_api.service(:AdGroupAdService, API_VERSION)
      gad = ad.google_ad
      ad_group_ad = {
        xsi_type: 'AdGroupAd',
        ad: gad,
        ad_group_id: ad.ad_group.ad_group_id,
        status: 'ENABLED'
      }
      operation = { operator: 'ADD', operand: ad_group_ad }
      new_gad = {}
      begin
        result = service.mutate([operation])
        if result[:value].present?
          new_gad = result[:value].first[:ad]
          puts "***\n*** Created responsive display ad (#{ ad.ad_group.campaign.type.match('topic') ? 'topic' : 'retarget' })\n***"
          log_result([new_gad])
        else
          # should be exception; why here?
          new_gad[:errors] = ["unknown"]
        end
      rescue AdwordsApi::Errors::ApiException => e
        new_gad[:errors] = e.errors.map do |error|
          {
            type: error[:error_string].split('.').last,
            field: error[:field_path].split('.').last
          }
        end
        puts "***\n*** Failed to create responsive display ad for story:"
        puts "*** #{ad.story.title}\n***"
        awesome_print(new_gad[:errors])
      rescue AdsCommon::Errors::ApiException => e
        new_gad[:errors] = e.message
        puts "***\n*** Failed to create responsive display ad for story:"
        puts "*** #{ad.story.title}\n***"
        awesome_print(new_gad[:errors])
      end
      new_gad
    end

    def update_ads(ads)
      service = create_api.service(:AdService, API_VERSION)
      operations = ads.map do |ad|
        gad = ad.google_ad
        ad_group_operation = {
          operator: 'SET',
          operand: gad.merge({ id: ad.ad_id })
        }
      end
      updated_gads = {}
      begin
        result = service.mutate(operations)
        if result[:value].present?
          result[:value].each do |updated_gad|
            # the ad group id isn't returned by the AdService
            # campaign_type = (new_gad[:ad_group_id] == story.topic_ad.ad_group.ad_group_id) ? :topic : :retarget
            updated_gads[updated_gad[:id]] = updated_gad
            puts "***\n*** Updated responsive display ad\n***"
            log_result([updated_gad])
          end
        else
          # should be exception; why here?
        end
      rescue AdwordsApi::Errors::ApiException => e
        updated_gads[:errors] = e.errors.map do |error|
          {
            type: error[:error_string].split('.').last,
            field: error[:field_path].split('.').last
          }
        end
        puts "***\n*** Failed to update ads #{ads.map { |ad| ad.ad_id }.join(',')}\n***"
        awesome_print(updated_gads[:errors])

      # a missing ad_id will raise this exception
      rescue AdsCommon::Errors::ApiException => e
        updated_gads[:errors] = e.message
        puts "***\n*** Failed to update ads #{ads.map { |ad| ad.ad_id }.join(',')}\n***"
        awesome_print(updated_gads[:errors])
      end
      updated_gads
    end

    # note the different service needed to update ad status
    def change_ad_status(ad)
      service = create_api.service(:AdGroupAdService, API_VERSION)
      operation = {
        operator: 'SET',
        operand: {
          ad_group_id: ad.ad_group.ad_group_id,
          status: ad.status,
          ad: { id: ad.ad_id }
        }
      }
      updated_gad = {}
      begin
        result = service.mutate([operation])
        if result[:value].present?
          updated_gad = result[:value].first[:ad]
          puts "***\n*** Updated responsive display ad (#{ ad.campaign.type.match('Topic') ? 'topic' : 'retarget' })\n***"
          log_result([updated_gad])
        end
      rescue AdwordsApi::Errors::ApiException => e
        updated_gad[:errors] = e.errors.map do |error|
          {
            type: error[:error_string].split('.').last,
            field: error[:field_path].split('.').last
          }
        end
        puts "***\n*** Failed to update responsive display ad (#{ ad.campaign.type.match('Topic') ? 'topic' : 'retarget' })\n***"
        awesome_print(updated_gad[:errors])

      # a missing ad_id will raise this exception
      rescue AdsCommon::Errors::ApiException => e
        updated_gad[:errors] = e.message
      end
      updated_gad
    end

    def remove_ads(ads)
      # ads.delete_if { |ad| (ad.values & ['', nil]).present? }
      service = create_api.service(:AdGroupAdService, API_VERSION)
      operations = ads.map do |ad|
        ad_group_ad = {
          ad_group_id: ad[:ad_group_id],
          ad: {
            id: ad[:ad_id],
            # xsi_type: 'MultiAssetResponsiveDisplayAd'
          },
        }
        ad_group_operation = {
          operator: 'REMOVE',
          operand: ad_group_ad
        }
      end
      begin
        result = service.mutate(operations)

      # Authorization error.
      rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      # HTTP errors.
      rescue AdsCommon::Errors::HttpError => e
        puts "HTTP Error: %s" % e
        # flash[:alert] = Rails.env.development? ? "HTTP error: #{e}" : 'Error removing Promoted Story'
      # API errors.
      rescue AdwordsApi::Errors::ApiException => e
        # removed_gad[:errors] = e.errors.map do |error|
        #   {
        #     type: error[:error_string].split('.').last,
        #     field: error[:field_path].split('.').last
        #   }
        # end
        # puts "***\n*** Failed to remove responsive display ad #{ ad_id }\n***"
        # awesome_print(removed_gad[:errors])
      rescue AdsCommon::Errors::ApiException => e
        # removed_gad[:errors] = e.message
        # puts e.message
        # puts "***\n*** Failed to remove responsive display ad #{ ad_id }\n***"
      end
      puts "***\n*** Removed these ad(s):\n***"
      awesome_print(result[:value].map { |ad| ad[:ad][:id] }) if result[:value].present?
    end

    def create_campaigns(company_subdomain)
      api = create_api

      # Create a budget, which can be shared by multiple campaigns.
      # budget_srv = api.service(:BudgetService, API_VERSION)
      # budget = {
      #   :name => "#{company_subdomain} budget",
      #   :amount => {:micro_amount => 5000000},
      #   :delivery_method => 'STANDARD'
      # }
      # budget_operation = { :operator => 'ADD', :operand => budget }
      # return_budget = budget_srv.mutate([budget_operation])
      # budget_id = return_budget[:value].first[:budget_id]

      campaign_srv = api.service(:CampaignService, API_VERSION)
      campaigns = [
        {
          :name => "#{company_subdomain} display topic",
          # Recommendation: Set the campaign to PAUSED when creating it to stop the
          # ads from immediately serving. Set to ENABLED once you've added
          # targeting and the ads are ready to serve.
          :status => 'ENABLED',
          :bidding_strategy_configuration => {
            :bidding_strategy_type => 'MANUAL_CPC'
          },
          # Budget (required) - note only the budget ID is required.
          :budget => {:budget_id => budget_id},
          :advertising_channel_type => 'DISPLAY',
          # Optional fields:
          # :start_date =>
          #     DateTime.parse((Date.today + 1).to_s).strftime('%Y%m%d'),
          # :network_setting => {
          #   :target_google_search => true,
          #   :target_search_network => true,
          #   :target_content_network => true
          # },
          # :settings => [
          #   {
          #     :xsi_type => 'GeoTargetTypeSetting',
          #     :positive_geo_target_type => 'DONT_CARE',
          #     :negative_geo_target_type => 'DONT_CARE'
          #   }
          # ],
          # :frequency_cap => {
          #   :impressions => '5',
          #   :time_unit => 'DAY',
          #   :level => 'ADGROUP'
          # }
        },
        {
          :name => "#{company_subdomain} display retarget",
          :status => 'ENABLED',
          :bidding_strategy_configuration => {
            :bidding_strategy_type => 'MANUAL_CPC'
          },
          :budget => { :budget_id => budget_id },
          :advertising_channel_type => 'DISPLAY'
        }
      ]

      # Prepare for adding campaign.
      operations = campaigns.map do |campaign|
        {:operator => 'ADD', :operand => campaign}
      end

      # Add campaign.
      response = campaign_srv.mutate(operations)
      if response and response[:value]
        response[:value].each do |campaign|
          puts "Campaign with name '%s' and ID %d was added." %
              [campaign[:name], campaign[:id]]
        end
      else
        raise new StandardError, 'No campaigns were added.'
      end
      # TODO: attach labels!
      new_topic_campaign = response[:value].select { |campaign| campaign[:name].match('topic') }
      new_retarget_campaign = response[:value].select { |campaign| campaign[:name].match('retarget') }
      {
        topic: { id: new_topic_campaign[:id] },
        retarget: { id: new_retarget_campaign[:id] }
      }
    end

    def get_campaigns(campaign_ids, company_subdomain)
      service = create_api.service(:CampaignService, API_VERSION)
      ids_selector = {
        :fields => ['Id', 'Name', 'Status', 'Labels'],
        :predicates => [
          {
            :field => 'Id',
            :operator => 'IN',
            :values => campaign_ids
          }
        ]
      }
      names_selector = {
        :fields => ['Id', 'Name', 'Status', 'Labels'],
        :predicates => [
          {
            :field => 'Name',
            :operator => 'CONTAINS',
            :values => [company_subdomain]
          }
        ]
      }
      begin
        campaigns_found_by_id = campaign_ids.all? { |id| id.present? } &&
                                service.get(ids_selector)[:entries]
        if campaigns_found_by_id.blank?
          campaigns_found_by_name = service.get(names_selector)[:entries]
          pp campaigns_found_by_name
          return campaigns_found_by_name
        else
          pp campaigns_found_by_id
          return campaigns_found_by_id
        end
      rescue AdwordsApi::Errors::ApiException => e
        puts "Exception occurred: %s\n%s" % [e.to_s, e.message]
        return [e.to_s, e.message]
      end
    end

    def create_ad_groups(topic_campaign_id, retarget_campaign_id)
      # AdwordsApi::Api will read a config file from ENV['HOME']/adwords_api.yml
      # when called without parameters.
      adwords = AdwordsApi::Api.new

      # To enable logging of SOAP requests, set the log_level value to 'DEBUG' in
      # the configuration file or provide your own logger:
      # adwords.logger = Logger.new('adwords_xml.log')

      ad_group_srv = adwords.service(:AdGroupService, API_VERSION)

      ad_groups = [
        {
          :name => 'ad group display topic',
          :status => 'ENABLED',
          :campaign_id => topic_campaign_id,
          :bidding_strategy_configuration => {
            :bids => [
              {
                # The 'xsi_type' field allows you to specify the xsi:type of the
                # object being created. It's only necessary when you must provide
                # an explicit type that the client library can't infer.
                :xsi_type => 'CpcBid',
                :bid => {:micro_amount => 10000000}
              }
            ]
          },
          # :ad_group_ad_rotation_mode => {
          #   :ad_rotation_mode => 'OPTIMIZE'
          # },
          # :settings => [
          #   # Targeting restriction settings. Depending on the :criterion_type_group
          #   # value, most TargetingSettingDetail only affect Display campaigns.
          #   # However, the USER_INTEREST_AND_LIST value works for RLSA campaigns -
          #   # Search campaigns targeting using a remarketing list.
          #   {
          #     :xsi_type => 'TargetingSetting',
          #     :details => [
          #       # Restricting to serve ads that match your ad group placements.
          #       # This is equivalent to choosing "Target and bid" in the UI.
          #       {
          #         :xsi_type => 'TargetingSettingDetail',
          #         :criterion_type_group => 'PLACEMENT',
          #         :target_all => false
          #       },
          #       # Using your ad group verticals only for bidding. This is equivalent
          #       # to choosing "Bid only" in the UI.
          #       {
          #         :xsi_type => 'TargetingSettingDetail',
          #         :criterion_type_group => 'VERTICAL',
          #         :target_all => true
          #       }
          #     ]
          #   }
          # ]
        },
        {
          :name => 'ad group display retarget',
          :status => 'ENABLED',
          :campaign_id => retarget_campaign_id,
          :bidding_strategy_configuration => {
            :bids => [
              {
                # The 'xsi_type' field allows you to specify the xsi:type of the
                # object being created. It's only necessary when you must provide
                # an explicit type that the client library can't infer.
                :xsi_type => 'CpcBid',
                :bid => {:micro_amount => 10000000}
              }
            ]
          }
        }
      ]

      # Prepare operations for adding ad groups.
      operations = ad_groups.map do |ad_group|
        {:operator => 'ADD', :operand => ad_group}
      end

      # Add ad groups.
      response = ad_group_srv.mutate(operations)
      if response and response[:value]
        response[:value].each do |ad_group|
          puts "Ad group ID %d was successfully added." % ad_group[:id]
        end
      else
        raise StandardError, 'No ad group was added'
      end
      new_topic_ad_group = response[:value].select { |ad_group| ad_group[:name].match('topic') }
      new_retarget_ad_group = response[:value].select { |ad_group| ad_group[:name].match('retarget') }
      {
        topic: { id: new_topic_ad_group[:id] },
        retarget: { id: new_retarget_ad_group[:id] }
      }
    end

    def get_ad_groups(campaign_ids)
      return [] unless campaign_ids.all? { |id| id.present? }
      api = create_api
      service = api.service(:AdGroupService, API_VERSION)
      selector = {
        fields: ['Id', 'Name', 'Status', 'CampaignId', 'Labels'],
        predicates: [{ field: 'CampaignId', operator: 'IN', values: campaign_ids }]
      }
      begin
        result = service.get(selector)
      rescue AdwordsApi::Errors::ApiException => e
        # logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
        return [e.to_s, e.message]
      end
      result[:entries]
    end

    def get_ad_group_ads(ad_group_ids)
      return [] unless ad_group_ids.all? { |id| id.present? }
      service = create_api.service(:AdGroupAdService, API_VERSION)
      selector = {
        fields: ['Id', 'Name', 'Status', 'Headline', 'LongHeadline', 'Labels'],
        ordering: [{ field: 'Id', sort_order: 'ASCENDING' }],
        predicates: [{ field: 'AdGroupId', operator: 'IN', values: ad_group_ids }]
        # paging: { start_index: 0, number_results: 50 },
      }
      begin
        result = service.get(selector)
      rescue AdwordsApi::Errors::ApiException => e
        # logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
        return [e.to_s, e.message]
      end
      result[:entries]
    end

    def get_ad(ad_id)
      service = create_api.service(:AdGroupAdService, API_VERSION)
      selector = {
        fields: ['Id', 'Name', 'Status', 'LongHeadline', 'Labels', 'FormatSetting'],
        ordering: [{ field: 'Id', sort_order: 'ASCENDING' }],
        predicates: [{ field: 'Id', operator: 'IN', values: [ad_id] }]
      }
      begin
        result = service.get(selector)
      rescue AdwordsApi::Errors::ApiException => e
        # logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
        # return [e.to_s, e.message]
      end
      result[:entries].try(:[], 0)
    end

    def upload_image_asset(ad_image)
      api = create_api
      service = api.service(:AssetService, API_VERSION)
      begin
        base64_image_data = Base64.encode64(AdsCommon::Http.get(ad_image.image_url, api.config))
      rescue
        return  # if image_url is blank
      end
      image_asset = {
        :xsi_type => 'ImageAsset',
        # Optional: Provide a unique friendly name to identify your asset. If you
        # specify the assetName field, then both the asset name and the image being
        # uploaded should be unique, and should not match another ACTIVE asset in
        # this customer account.
        # :asset_name => 'Image asset %s' % (Time.new.to_f * 1000).to_i,
        :image_data => base64_image_data
      }
      asset_operation = { :operator => 'ADD', :operand => image_asset }
      # Make the mutate request.
      begin
        result = service.mutate([asset_operation])
      rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      rescue AdsCommon::Errors::HttpError => e
      rescue AdwordsApi::Errors::ApiException => e
      end
      # pp result
      if result.present?
        puts ad_image[:asset_id]
        uploaded_image = result[:value].first
        ad_image[:google_url] = uploaded_image[:full_size_info][:image_url]
        ad_image[:asset_id] = uploaded_image[:asset_id]
        uploaded_image
      else
        puts 'No images uploaded.'
        nil
      end
    end

    def get_image_assets(asset_ids=nil)
      service = create_api.service(:AssetService, API_VERSION)
      selector = {
      :fields => ['AssetId', 'AssetName', 'AssetStatus', 'ImageFileSize', 'ImageWidth',
          'ImageHeight', 'ImageFullSizeUrl'],
      :predicates => [
        asset_ids.present? ?
          { :field => 'AssetId', :operator => 'IN', :values => asset_ids } :
          { :field => 'AssetSubtype', :operator => 'IN', :values => ['IMAGE'] }
      ],
      # :paging => {
      #     :start_index => 0,
      #     :number_results => PAGE_SIZE
      }
      begin
        result = service.get(selector)
      rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      rescue AdsCommon::Errors::HttpError => e
      rescue AdwordsApi::Errors::ApiException => e
      end
      if result[:entries].present?
        result[:entries].each_with_index do |entry, i|
          full_dimensions = entry[:full_size_info]
          # puts ('%s) Image asset with id = "%s", name = "%s" ' +
          #     'and status = "%s" was found.') %
          #     [i+1, entry[:asset_id], entry[:asset_name], entry[:asset_status]]
          # puts '  Size is %sx%s and asset URL is %s.' %
          #     [full_dimensions[:image_width],
          #     full_dimensions[:image_height],
          #     full_dimensions[:image_url]]
        end
        # puts "\tFound %d entries." % result[:total_num_entries]
        asset_ids ? result[:entries] : result[:total_num_entries]
      else
        nil
      end
    end

    private

    def log_result(gads)
      gads.each do |gad|
        awesome_print({
          id: gad[:id],
          # status: gad[:status],  # not included with AdService
          long_headline: gad[:long_headline][:asset][:asset_text],
          short_headlines: gad[:headlines].map { |h| h[:asset][:asset_text] },
          descriptions: gad[:descriptions].map { |d| d[:asset][:asset_text] },
          square_marketing_images: gad[:square_marketing_images].map { |i| i[:asset][:asset_id] },
          landscape_marketing_images: gad[:marketing_images].map { |i| i[:asset][:asset_id] },
          square_logos: gad[:logo_images].try(:map) { |i| i[:asset][:asset_id] },
          landscape_logos: gad[:landscape_logo_images].try(:map) { |i| i[:asset][:asset_id] },
          final_urls: gad[:final_urls]
        })
      end
    end

    def create_label(label)
      service = create_api.service(:LabelService, API_VERSION)
      operation = {
        operator: 'ADD',
        operand: {
          xsi_type: 'TextLabel',
          name: label
        }
      }
      result = service.mutate([operation])
      result[:value][0]
    end

    def add_label(ad, label_id)
      service = create_api.service(:AdGroupAdService, API_VERSION)
      operation = {
        operator: 'ADD',
        operand: {
          ad_id: ad.ad_id,
          ad_group_id: ad.ad_group.ad_group_id,
          label_id: label_id
        }
      }
      response = service.mutate_label([operation])
      if response and response[:value]
        response[:value].each do |ad_label|
          puts "Story label for ad ID %d and label ID %d was added.\n" %
              [ad.ad_id, ad_label[:label_id]]
        end
      end
    end

    def get_label(label_name)
      service = create_api.service(:LabelService, API_VERSION)
      selector = {
        fields: ['LabelName'],
        ordering: [{ field: 'LabelName', sort_order: 'ASCENDING' }],
        # paging: { start_index: 0, number_results: 50 },
        predicates: [{ field: 'LabelName', operator: 'IN', values: [label_name] }]
      }
      begin
        result = service.get(selector)
      rescue AdwordsApi::Errors::ApiException => e
        # logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      end
      result[:entries].try(:[], 0) || nil
    end

    def create_api
      if ENV['ADWORDS_ENV'] == 'test'
        config_file = File.join(Rails.root, 'config', 'adwords_api_test.yml')
      elsif ENV['ADWORDS_ENV'] == 'production'
        config_file = File.join(Rails.root, 'config', 'adwords_api_prod.yml')
      end
      AdwordsApi::Api.new(config_file)
    end

  end

end