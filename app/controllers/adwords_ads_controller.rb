class AdwordsAdsController < ApplicationController
  def index
    company = Company.find params[:company_id]
    @ads = company.adwords_ads.topic
    respond_to(&:json)
  end

  def show
    ad = AdwordsAd.find params[:id] # this will be the topic ad
    @story = Story.includes(adwords_ads: { adwords_images: {} }).find(ad.story_id)
    # disable the ad links in production
    @company = @story.company
    @story_url = @story.csp_story_url
    @short_headline = @company.adwords_short_headline
    @long_headline = @story.ads.long_headline
    @call_to_action = 'See More'
  
    # must use strict_encode do newlines aren't added
    # @image_base64 = Base64.strict_encode64( open(@image_url) { |io| io.read } )
    # @image_dominant_color = Miro::DominantColors.new(@image_url).to_hex[0]
  
    # same for the logo
    @image_url =
      @story.ads.first&.images&.marketing&.landscape&.take&.image_url or
      @company.ad_images.default.marketing.landscape.take&.image_url or
      helpers.asset_url(RESPONSIVE_AD_LANDSCAPE_IMAGE_PLACEHOLDER)
    @square_image_url =
      @story.ads.first&.images&.marketing&.square&.take&.image_url or
      @company.ad_images.default.marketing.square.take&.image_url or
      helpers.asset_url(RESPONSIVE_AD_SQUARE_IMAGE_PLACEHOLDER)
    @logo_url =
      @story.ads.first&.images&.logo&.square&.take&.image_url or
      @company.ad_images.default.logo.square.take&.image_url or
      helpers.asset_url(RESPONSIVE_AD_SQUARE_LOGO_PLACEHOLDER)
    set_ad_parameters(@long_headline)
  end

  def edit
    @ad = AdwordsAd.find params[:id]
    render(:edit_ad_images)
  end

  def create
    story = Story.find params[:id]
    new_gads = {}
    # if missing local ad data, the gads will be created separately via AdwordsAd callback
    # if they already exist (expected), create them together
    if story.topic_ad.blank? || story.retarget_ad.blank?
      if story.topic_ad.blank?
        story.create_topic_ad(adwords_ad_group_id: story.company.topic_ad_group.id, status: 'PAUSED')
      else
        # new_topic_gad = GoogleAds::create_ad(story.topic_ad)
        # if new_topic_gad[:ad].present?
        #   story.topic_ad.update(ad_id: new_topic_gad[:ad][:id])
        # else
        #   # error
        # end
      end
      # new_gads[:topic] = story.topic_ad.slice(:ad_id, :long_headline)

      if story.retarget_ad.blank?
        story.create_retarget_ad(adwords_ad_group_id: story.company.retarget_ad_group.id, status: 'PAUSED')
      else
        # new_retarget_gad = GoogleAds::create_ad(story.retarget_ad)
        # if new_retarget_gad[:ad].present?
        #   story.retarget_ad.update(ad_id: new_retarget_gad[:ad][:id])
        # else
        #   # error
        # end
      end
      # new_gads[:retarget] = story.retarget_ad.slice(:ad_id, :long_headline)

    else
      story.ads.each(&:add_missing_default_images)
      # new_gads = GoogleAds::create_story_ads(story)
      # if new_gads[:errors]
      #   new_gads[:errors] = customize_gads_errors(new_gads)
      # else
      #   story.topic_ad.update(ad_id: new_gads[:topic][:ad_id])
      #   story.retarget_ad.update(ad_id: new_gads[:retarget][:ad_id])
      # end
    end
    respond_to do |format|
      format.json do
        render({
          json: {
            story: { id: story.id, title: story.title.truncate(30, separator: '...') },
            newGads: new_gads,
            # topicAd: story.topic_ad.slice(:id, :status),
            # retargetAd: story.retarget_ad.slice(:id, :status)
          }
        })
      end
    end
  end

  def update
    topic_ad = AdwordsAd.find params[:id]
    if topic_ad.update(ad_params) and topic_ad.story.retarget_ad.update(ad_params)
      if ad_params[:status].present?
        flash.now[:notice] = "Promoted Story is now #{topic_ad.status.downcase}"
      elsif ad_params[:adwords_image_ids].present?
        flash.now[:notice] = 'Promoted Story images have been updated'
      end
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace('toaster', partial: 'shared/toaster')
        end
      end
    else
      @errors = topic_ad.errors.full_messages
    end
  end

  private

  def ad_params
    params.require(:adwords_ad).permit(:status, :long_headline, :main_color, :accent_color, adwords_image_ids: [])
  end

  # padding for the lower half is 25px 11px
  # "*_minus_padding" means minus 25x2 = 50
  def set_ad_parameters(long_headline)
    @ads_params = ads_params_shell
    case long_headline.length
    when 75..90
      @ads_params[:tower][:sh_font_size] = '20px'
      @ads_params[:tower][:lh_font_size] = '13px'
      # @ads_params[:square191][:sh_font_size] = '15px'
      # @ads_params[:square191][:lh_font_size] = '10px'
    when 55...75
      @ads_params[:tower][:sh_font_size] = '24px'
      @ads_params[:tower][:lh_font_size] = '16px'
      # @ads_params[:square191][:sh_font_size] = ''
      # @ads_params[:square191][:lh_font_size] = ''
    when 45...55
      @ads_params[:tower][:sh_font_size] = '26px'
      @ads_params[:tower][:lh_font_size] = '17px'
      # @ads_params[:square191][:sh_font_size] = ''
      # @ads_params[:tower][:lh_font_size] = ''
    when 0...45
      @ads_params[:tower][:sh_font_size] = '28px'
      @ads_params[:tower][:lh_font_size] = '18px'
      # @ads_params[:square191][:sh_font_size] = ''
      # @ads_params[:tower][:lh_font_size] = ''
    end
    # end
  end

  def ads_params_shell
    {
      tower: {
        sh_font_size: '',
        lh_font_size: ''
      }
    }
  end
end
