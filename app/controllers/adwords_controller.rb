class AdwordsController < ApplicationController

  before_action(:authenticate_user!, only: [:preview])
  before_action { set_company(params) }
  before_action({ except: [:update_company, :sync_company] }) { set_story(params) }
  before_action { @promote_enabled = @company.promote_tr? }
  after_action({ except: [:preview, :sync_company] }) { flash.discard if request.xhr? }


  def update_company
    @company_params = company_params.to_h
    pp @company_params
    ##
    ##  method updates any ads that were affected by a removed image;
    ##  csp changes apply to subscribers and non-subscribers alike;
    ##
    # for any deleted images, update affected ads
    # (this is for subscribers and non-subscribers alike => ad id and ad group id may be nil)
    # (affected ads have already been assigned default image)
    # if promote isn't enabled, still need to respond with affected stories for table update
    if @company_params[:removed_images_ads].present?
      # puts "removed_images_ads are present"
      # # keep track of story ids to update promoted stories table
      # # every two successive ads (topic and retarget) will be associated with the same story,
      # # so put in a Set to prevent duplicates
      # @removed_images_stories = Set.new
      # @company_params[:removed_images_ads].each do |image|
      #   image[:ads_params].each do |ad_params|
      #     ad = AdwordsAd.includes(:story).find(ad_params[:csp_ad_id])
      #     @removed_images_stories << { csp_image_id: ad.adwords_image.id, story_id: ad.story.id }
      #     if @promote_enabled
      #       puts "removing and re-creating ad #{ad.id} associated with destroyed image #{ad_params['csp_image_id']}..."
      #       # ad.delay.remove_ad
      #       # ad.delay.create_ad
      #       # ad.delay.update_ad
      #       ad.remove_ad
      #       ad.create_ad
      #       ad.update_ad
      #     end
      #   end
      # end
    end



    # update company logo or short headline
    # if @promote_enabled # &&
      #  (@company_params.dig('previous_changes', 'adwords_short_headline') || @company_params['adwords_logo_url'])
      # @company.ads.each do |ad|
      #   # ad.delay.remove_ad
      #   # ad.delay.create_ad
      #   # ad.delay.update_ad
      #   ad.remove_ad
      #   ad.create_ad
      #   ad.update_ad
      # end
    # end

    @flash_status = "success"
    @flash_mesg = "Promoted Stories updated"
    respond_to do |format|
      format.js do
      end
    end
  end

  def preview
    # # disable the ad links in production
    # @company = @story.company
    # @is_production = ENV['HOST_NAME'] == 'customerstories.net'
    # @story_url = @story.csp_story_url
    # @short_headline = @company.adwords_short_headline
    # @long_headline = @story.ads.long_headline
    # @image_url = @story.ads.adwords_image.try(:image_url) ||
    #              @company.adwords_images.default.try(:image_url) ||
    #              RESPONSIVE_AD_LANDSCAPE_IMAGE_PLACEHOLDER
    # @logo_url = @company.adwords_logo_url || LOGO_PLACEHOLDER_URL
    # set_ad_dimensions(@long_headline)
    # render :ads_preview, layout: false
  end

  private

  def company_params
    params.require(:company).permit(
      :adwords_short_headline, :adwords_logo_url, :default_ad_image_url,
      # { adwords_images_attributes: [:id, :image_url, :default, :_destroy] },
      :default_was_uploaded, :required_ad_images_are_missing, :removed_ad_image_id,
      { new_ad_image: [:id, :image_url, :default] },
    )
  end

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
      @story = Story.includes(adwords_ads: { adwords_image: {} }).find_by_id(params[:id]) ||
               Story.includes(adwords_ads: { adwords_image: {} }).friendly.find(params[:story_slug])
    end
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


