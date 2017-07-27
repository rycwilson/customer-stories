class AdwordsController < ApplicationController

  before_action() { set_company(params) }
  before_action({ except: [:update_company, :sync_company] }) { set_story(params) }
  before_action() { @promote_enabled = @company.promote_tr? }
  after_action({ except: [:preview, :sync_company] }) { flash.discard if request.xhr? }

  def create_story_ads
    if @promote_enabled && @story.ads.all?() { |ad| ad.delay.create() }
      flash[:notice] = 'Story published and Sponsored Story created'
    else
      # TODO: attach errors to @story
    end
    respond_to { |format| format.js }
  end

  def update_story_ads
    # use .present? to get boolean instead of string
    @image_changed = params[:image_changed].present?
    @status_changed = params[:status_changed].present?
    @long_headline_changed = params[:long_headline_changed].present?

    if @promote_enabled && @status_changed
      if @story.ads.all?() { |ad| ad.delay.update_status() }
        flash[:notice] = "Sponsored Story #{@story.ads.enabled? ? 'enabled' : 'paused'}"
      else
        # TODO: attach errors to @story
      end

    elsif @promote_enabled && (@image_changed || @long_headline_changed)
      if @story.ads.all?() { |ad| ad.delay.remove() }
        if @story.ads.all?() { |ad| ad.delay.create() }
          # reload to get the new ad_id
          if @story.ads.reload.all? { |ad| ad.delay.update_status() }
            flash[:notice] = 'Sponsored Story updated'
          else
            # TODO: attach errors to @story
          end
        else
          # TODO: attach errors to @story
        end
      else
        # TODO: attach errors to @story
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
      # keep track of story ids to update promoted stories table
      # every two successive ads (topic and retarget) will be associated with the same story,
      # so put in a Set to prevent duplicates
      @removed_images_stories = Set.new
      params[:company][:removed_images_ads].each do |image|
        image[:ads_params].each() do |ad_params|
          ad = AdwordsAd.includes(:story).find(ad_params[:csp_ad_id])
          @removed_images_stories << { csp_image_id: ad.adwords_image.id, story_id: ad.story.id }
          if @promote_enabled
            puts "removing and re-creating ad #{ad.id} associated with destroyed image #{ad_params[:csp_image_id]}..."
            ad.delay.remove()
            ad.delay.create()
            ad.delay.update_status()
          end
        end
      end
    end

    # upload any new images
    if @promote_enabled && new_images?(params[:company])
      get_new_images(params[:company]).each() do |image_params|  # { type: , url: }
        @company.delay.upload_adwords_image_or_logo(image_params) or return # return if error
      end
    end

    # update company logo or short headline
    if @promote_enabled &&
       ( params[:company].dig(:previous_changes, :adwords_short_headline) ||
         params[:company][:adwords_logo_url] )
      @company.ads.each() do |ad|
        ad.delay.remove()
        ad.delay.create()
        ad.delay.update_status()
      end
    end

    @flash_status = "success"
    @flash_mesg = "Sponsored Stories updated"

    respond_to do |format|
      format.html do
        cookies[:workflow_stage] = 'promote'
        cookies[:workflow_substage] = 'promote-settings'
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
    if @company.ready_for_adwords_sync?()
      @company.adwords_sync()
      flash = { notice: "Successfully synced with AdWords" }
    else
      flash = { alert: "Company not ready for syncing with AdWords" }
    end
    cookies[:workflow_stage] = 'promote'
    cookies[:workflow_substage] = 'promoted-stories'
    redirect_to(company_path(@company), flash: flash)
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


