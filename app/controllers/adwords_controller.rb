class AdwordsController < ApplicationController

  require 'adwords_api'
  before_action { @company = Company.find_by(subdomain: request.subdomain) }

  def previews
    @type = params[:type]
    varmour_marketing_img_url = "https://tpc.googlesyndication.com/simgad/14020142471839339698"
    story = Story.find_by(title: params[:story_title])

    # @topic_campaign = get_campaign(@company, 'topic')
    # @retarget_campaign = get_campaign(@company, 'retarget')

    # @topic_ad_group = get_ad_group(@company, 'topic')
    # @retarget_ad_group = get_ad_group(@company, 'retarget')

    @topic_ads = get_ads(@company, 'topic')
    @retarget_ads = get_ads(@company, 'retarget')

    @preview_html = render_to_string(
                      partial: "adwords/ad_templates/#{@type}",
                      locals: {
                        company_name: @company.name,
                        story_title: params[:story_title],
                        story_url_encoded: url_encode(story.csp_story_url),
                        marketing_img_url: varmour_marketing_img_url
                      },
                      layout: false
                    )
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
    api = get_adwords_api()
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


end


