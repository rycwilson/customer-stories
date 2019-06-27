class AdwordsAdsController < ApplicationController

  def create
    story = Story.find params[:id]
    new_gads = {}
    # if missing local ad data, the gads will be created separately via AdwordsAd callback
    # if they already exist (expected), create them together
    if story.topic_ad.blank? || story.retarget_ad.blank?
      if story.topic_ad.blank?
        story.create_topic_ad(adwords_ad_group_id: story.company.topic_ad_group.id, status: 'ENABLED')
      else
        new_topic_gad = GoogleAds::create_ad(story.topic_ad)
        if new_topic_gad[:ad].present?
          story.topic_ad.update(ad_id: new_topic_gad[:ad][:id])
        else
          # error
        end
      end
      new_gads[:topic] = story.topic_ad.slice(:ad_id, :description)

      if story.retarget_ad.blank?
        story.create_retarget_ad(adwords_ad_group_id: story.company.retarget_ad_group.id, status: 'ENABLED')
      else
        new_retarget_gad = GoogleAds::create_ad(story.retarget_ad)
        if new_retarget_gad[:ad].present?
          story.retarget_ad.update(ad_id: new_retarget_gad[:ad][:id])
        else
          # error
        end
      end
      new_gads[:retarget] = story.retarget_ad.slice(:ad_id, :description)

    else
      add_missing_default_images(story)
      new_gads = GoogleAds::create_story_ads(story)
      if new_gads[:errors]
        new_gads[:errors] = customize_gads_errors(new_gads)
      else
        story.topic_ad.update(ad_id: new_gads[:topic][:ad_id])
        story.retarget_ad.update(ad_id: new_gads[:retarget][:ad_id])
      end
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

  # update the story with topic_ad_attributes and retarget_ad_attributes
  def update
    # puts 'adwords_ads#update'
    # awesome_print(story_params.to_h)
    story = Story.find(params[:id])

    # in case there's an error and we need to revert association changes
    existing_ads_image_ids = story.ads.first.adwords_image_ids
    if story.update(story_params)
      updated_gads = {}
      [story.topic_ad, story.retarget_ad].each_with_index do |ad, index|

        # for non-promoted-enabled companies, changing status will be blocked,
        # but other ad parameters can be changed
        # => confirm presence of ad_id before updating google
        updated_gad = (ad.previous_changes.keys & ['status']).any? ?
          GoogleAds::change_ad_status(ad) :
          (ad.ad_id.present? ? GoogleAds::update_ads([ad]) : nil)

        # revert changes if google errors (update_columns method => no callbacks)
        if updated_gad.try(:[], :errors)
          if (ad.previous_changes.keys & ['description', 'status']).any?
            ad.update_columns(
              ad.previous_changes.map { |attr, val| [attr, val.shift] }.to_h
            )
          else
            ad.adwords_image_ids = existing_ads_image_ids  # saves immediately, skips the callback
          end
        end
        updated_gads[index == 0 ? :topic : :retarget] = updated_gad
      end
    else
      # error
    end

    # datatables updated row data (mirrors stories#promoted)
    dt_data = [
      JSON.parse(
        story.to_json({
          only: [:id, :title, :slug],
          methods: [:ads_status, :ads_description, :ads_images, :csp_story_path],
          include: {
            success: {
              only: [],
              include: {
                customer: { only: [:name, :slug] }
              }
            },
            topic_ad: { only: [:id] },
            retarget_ad: { only: [:id, :status] }
          }
        })
      )
    ]

    respond_to do |format|
      format.json do
        render({
          json: {
            data: dt_data,
            error: '',  # datatables will look here for it's own flash message system
            errors: updated_gads.any? { |type, ad| ad.try(:[], :errors) }
          }.to_json
        })
      end

      # in most case it's sufficient to get data from a single ad (e.g. topic)),
      # since topic and retarget are supposed to be sync'ed
      format.js do
        @response_data = {}
        @response_data[:promotedStory] = dt_data[0]

        # presently only one attribute will change at a time
        @response_data[:previousChanges] = story.topic_ad.previous_changes.first
        @response_data[:gadsErrors] = updated_gads.any? { |type, ad| ad.try(:[], :errors) }
        @response_data[:isImagesUpdate] = story_params.to_h[:topic_ad_attributes][:adwords_image_ids].present?
      end
    end
  end

  def preview
    if request.params[:company_preview].present? 
      company = Company.find_by(subdomain: request.subdomain)
      company_preview = request.params[:company_preview]
      company_preview.each { |k,v| company_preview[k] = nil if v == '' }
      story = nil
    else
      story = Story.includes(adwords_ads: { adwords_images: {} }).friendly.find(params[:story_slug])
      company = story.company
    end
    @business_name = company_preview.try(:[], :gads_business_name) ||
        company.gads_business_name || 
        company.name.truncate(25)
    @short_headline = company_preview.try(:[], :gads_default_short_headline) ||
        story.try(:ads_short_headline) || 
        company.gads_default_short_headline
    @long_headline = company_preview.try(:[], :gads_default_long_headline) ||
        story.try(:ads_long_headline) || 
        "The Promoted Story Title goes here. It is copied from the Customer Story Title by default"
    @description = story.try(:ads_description) || 
        "The Promoted Story Title goes here. It is copied from the Customer Story Title by default"
    @cta_text = company_preview.try(:[], :gads_default_cta_text) ||
        story.try(:ads_cta_text) ||
        company.gads_default_cta_text
    @main_color = company_preview.try(:[], :gads_default_main_color) ||
        story.try(:ads_main_color) || 
        company.gads_default_main_color 
    @accent_color = company_preview.try(:[], :gads_default_accent_color) ||
        story.try(:ads_accent_color) || 
        company.gads_default_accent_color
    story_url = story.try(:csp_story_url)
    
    @button_background = company.color_contrast(@accent_color)
    @short_headline_background = company.color_contrast(@main_color)
    @cta_background = company.color_contrast(@main_color)

    @image_url = random_ad_image(company, story, 'LandscapeImage', (story.try(:topic_ad) || company).adwords_images.landscape_images)
    @square_image_url = random_ad_image(company, story, 'SquareImage', (story.try(:topic_ad) || company).adwords_images.square_images)
    @logo_url = random_ad_image(company, story, 'SquareLogo', (story.try(:topic_ad) || company).adwords_images.square_logos)
    
    # disable the ad links in production
    @is_production = ENV['HOST_NAME'] == 'customerstories.net'
    
    # TODO: change this from the placeholder with dimensions to an actual image placeholder
    # same for the logo
    
    
    
    # must use strict_encode do newlines aren't added
    # @image_base64 = Base64.strict_encode64( open(@image_url) { |io| io.read } )
    # @image_dominant_color = Miro::DominantColors.new(@image_url).to_hex[0]
    
    
    set_ad_parameters(@description)
    render :ads_preview, layout: false
  end
    
  private
  
  def story_params
    params.require(:story).permit(
      topic_ad_attributes: [ :id, :status, :description, :short_headline, :long_headline, adwords_image_ids: [] ],
      retarget_ad_attributes: [ :id, :status, :description, :short_headline, :long_headline, adwords_image_ids: [] ]
      )
  end
    
  # previews
  # def company_params
  #   params.require(:company).permit(
  #     :gads_business_name, :gads_default_short_headline, :gads_default_long_headline,
  #     :gads_default_cta_text, :gads_default_main_color, :gads_default_accent_color
  #   )
  # end
      
  def add_missing_default_images(story)
    default_images = story.company.adwords_images.default
    story.ads.each do |ad|
      ad.square_images << default_images.square_images unless ad.square_images.present?
      ad.landscape_images << default_images.landscape_images unless ad.landscape_images.present?
      ad.square_logos << default_images.square_logos unless ad.square_logos.present?
      ad.landscape_logos << default_images.landscape_logos unless ad.landscape_logos.present?
      ad.save
    end
  end
      
  def customize_gads_errors(new_gads)
    errors = []
    new_gads[:errors].each do |error|
      case error[:type]
      when 'INVALID_ID'
        errors << "Not found: #{ error[:field].underscore.humanize.downcase.singularize }"
      when 'REQUIRED'
        errors << "Required: #{ error[:field].underscore.humanize.downcase.singularize }"
        # when something else
      else
      end
    end
    errors
  end
      
  def gads_errors?(story, checklist)
    return false unless story.company.promote_tr?
    return story.ads.all? { |ad| ad.ad_id.present? } ? false : true
  end
      
  # padding for the lower half is 25px 11px
  # "*_minus_padding" means minus 25x2 = 50
  def set_ad_parameters(description)
    @ads_params = ads_params_shell
    case description.length
    when 75..90
      @ads_params[:tower][:sh_font_size] = '20px'
      @ads_params[:tower][:desc_font_size] = '13px'
      # @ads_params[:square191][:sh_font_size] = '15px'
      # @ads_params[:square191][:desc_font_size] = '10px'
    when 55...75
      @ads_params[:tower][:sh_font_size] = '24px'
      @ads_params[:tower][:desc_font_size] = '16px'
      # @ads_params[:square191][:sh_font_size] = ''
      # @ads_params[:square191][:desc_font_size] = ''
    when 45...55
      @ads_params[:tower][:sh_font_size] = '26px'
      @ads_params[:tower][:desc_font_size] = '17px'
      # @ads_params[:square191][:sh_font_size] = ''
      # @ads_params[:tower][:desc_font_size] = ''
    when 0...45
      @ads_params[:tower][:sh_font_size] = '28px'
      @ads_params[:tower][:desc_font_size] = '18px'
      # @ads_params[:square191][:sh_font_size] = ''
      # @ads_params[:tower][:desc_font_size] = ''
    end
    # end
  end
  
  def ads_params_shell
    {
      tower: {
        sh_font_size: '',
        desc_font_size: ''
      }
    }
  end
  
  def random_ad_image(company, story, type, images)
    placeholder = case type 
      when 'LandscapeImage'
        RESPONSIVE_AD_LANDSCAPE_IMAGE_PLACEHOLDER
      when 'SquareImage'
        RESPONSIVE_AD_SQUARE_IMAGE_PLACEHOLDER
      when 'SquareLogo'
        RESPONSIVE_AD_SQUARE_LOGO_PLACEHOLDER
      end
    (images.length && images[rand(0...images.length)].image_url) || placeholder
  end
      
end
            
            
            