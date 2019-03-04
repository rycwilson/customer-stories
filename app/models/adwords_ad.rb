class AdwordsAd < ApplicationRecord

  require 'adwords_api'
  ADWORDS_API_VERSION = :v201809

  belongs_to :adwords_ad_group
  alias_attribute :ad_group, :adwords_ad_group
  has_one :adwords_campaign, through: :adwords_ad_group
  alias_attribute :campaign, :adwords_campaign
  has_one :company, through: :adwords_campaign
  belongs_to :story
  has_one :adwords_ads_image, dependent: :destroy
  has_one :adwords_ads_image, dependent: :destroy
  has_one :adwords_image, through: :adwords_ads_image\

  def adwords_create
    api = create_adwords_api
    service = api.service(:AdGroupAdService, ADWORDS_API_VERSION)
    campaign_type = self.campaign.type == 'TopicCampaign' ? 'topic' : 'retarget'
    responsive_display_ad = {
      xsi_type: 'ResponsiveDisplayAd',
      # media_id can't be nil
      logo_image: { media_id: self.company.adwords_logo_media_id },
      marketing_image: { media_id: self.adwords_image.media_id },
      short_headline: self.company.adwords_short_headline,
      long_headline: self.long_headline,
      description: self.long_headline,
      business_name: self.company.adwords_short_headline,
      final_urls: [ self.story.csp_story_url + "?utm_campaign=promote&utm_content=#{ campaign_type }&utm_source=&utm_medium=&utm_term=" ]
    }
    responsive_display_ad_group_ad = {
      ad_group_id: self.ad_group.ad_group_id,
      ad: responsive_display_ad,
      status: self.status
    }
    responsive_display_ad_group_ad_operations = {
      operator: 'ADD',
      operand: responsive_display_ad_group_ad
    }

    begin
      result = service.mutate([responsive_display_ad_group_ad_operations])

    # Authorization error.
    rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      puts 'Invalid Adwords API Oauth2 credentials'
      # flash[:alert] = Rails.env.development? ? 'Invalid Adwords API Oauth2 credentials' : 'Error creating Promoted Story'
    # HTTP errors.
    rescue AdsCommon::Errors::HttpError => e
      puts "HTTP Error: %s" % e
      # flash[:alert] = Rails.env.development? ? "HTTP error: #{e}" : 'Error creating Promoted Story'
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
      # flash[:alert] = Rails.env.development? ? "API error: #{e.message}" : 'Error creating Promoted Story'
    end

    # on success, log and update adwords_ad.ad_id
    if result && result[:value]
      result[:value].each do |ad_group_ad|
        logger.info ('New responsive display ad with id %d and short headline %s was ' +
            'added.') % [ad_group_ad[:ad][:id], ad_group_ad[:ad][:short_headline]]
      end
      # update the ad_id (but not status; csp will manage that)
      self.update(ad_id: result[:value][0][:ad][:id])
      # add a story label to the ad
      add_story_label( (get_story_label || create_story_label)[:id] )
      return true
    else
      logger.info "No responsive display ads were added."
      return false
    end
  end

  def adwords_remove
    api = create_adwords_api()
    service = api.service(:AdGroupAdService, ADWORDS_API_VERSION)
    operation = {
      operator: 'REMOVE',
      operand: {
        ad_group_id: self.ad_group.ad_group_id,
        ad: {
          xsi_type: 'ResponsiveDisplayAd',
          id: self.ad_id
        }
      }
    }
    begin
      response = service.mutate([operation])
    # Authorization error.
    rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      # flash[:alert] = Rails.env.development? ? 'Invalid Adwords API credentials' : 'Error removing Promoted Story'
    # HTTP errors.
    rescue AdsCommon::Errors::HttpError => e
      puts "HTTP Error: %s" % e
      # flash[:alert] = Rails.env.development? ? "HTTP error: #{e}" : 'Error removing Promoted Story'
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
      # flash[:alert] = Rails.env.development? ? "Adwords API error: #{e.message}" : 'Error removing Promoted Story'
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

  def adwords_update
    api = create_adwords_api
    service = api.service(:AdGroupAdService, ADWORDS_API_VERSION)
    operation =  {
      operator: 'SET',
      operand: {
        ad_group_id: self.ad_group.ad_group_id,
        status: self.status,
        ad: { id: self.ad_id }
      }
    }
    begin
      response = service.mutate([operation])

    # Authorization error.
    rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      # flash[:alert] = Rails.env.development? ? 'Invalid Adwords API credentials' : 'Error updating Promoted Story status'
    # HTTP errors.
    rescue AdsCommon::Errors::HttpError => e
      puts "HTTP Error: %s" % e
      # flash[:alert] = Rails.env.development? ? "HTTP error: #{e}" : 'Error updating Promoted Story status'
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
      # flash[:alert] = Rails.env.development? ? "Adwords API error: #{e.message}" : 'Error updating Promoted Story status'
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

  # Creates an instance of AdWords API class
  def create_adwords_api
    if ENV['ADWORDS_ENV'] == 'test'
      config_file = File.join(Rails.root, 'config', 'adwords_api_test.yml')
    elsif ENV['ADWORDS_ENV'] == 'production'
      config_file = File.join(Rails.root, 'config', 'adwords_api_prod.yml')
    end
    AdwordsApi::Api.new(config_file)
  end

  def get_story_label
    api = create_adwords_api
    service = api.service(:LabelService, ADWORDS_API_VERSION)
    selector = {
      fields: ['LabelName'],
      ordering: [ { field: 'LabelName', sort_order: 'ASCENDING' } ],
      paging: { start_index: 0, number_results: 50 },
      predicates: [ { field: 'LabelName', operator: 'IN', values: [self.story.id] } ]
    }
    result = nil
    begin
      result = service.get(selector)
    rescue AdwordsApi::Errors::ApiException => e
      logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      # flash[:alert] = 'API request failed with an error, see logs for details'
    end
    result[:entries].try(:[], 0) || nil
  end

  def create_story_label
    api = create_adwords_api()
    service = api.service(:LabelService, ADWORDS_API_VERSION)
    operation = {
      operator: 'ADD',
      operand: {
        xsi_type: 'TextLabel',
        name: self.story.id
      }
    }
    result = service.mutate([operation])
    result[:value][0]  # return the new label
  end

  def add_story_label (story_label_id)
    api = create_adwords_api()
    service = api.service(:AdGroupAdService, ADWORDS_API_VERSION)
    operation = {
      operator: 'ADD',
      operand: {
        ad_id: self.ad_id,
        ad_group_id: self.ad_group.ad_group_id,
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
