# frozen_string_literal: true

class ImageCardComponent < ViewComponent::Base
  # For smaller templates, ok to define them here:
  # slim_template <<-SLIM
  # (Remember to escape interpolated strings)
  # SLIM

  def initialize(
    model,
    image_data: {},
    collection: nil,
    upload_enabled: true, 
    required: false,
    selected: false
  )
    if image_data[:type].present? && !collection
      collection = image_data[:type].split(/(?=[A-Z])/).last.downcase.pluralize
    end
    @model = model
    @image_data = image_data
    @required = required
    @collection = collection
    @selected = selected
    @upload_enabled = upload_enabled
  end

  def container_attributes
    {
      class: [
        'image-card',
        { 
          "image-card--#{@image_data[:type]}" => @image_data[:type].present?,
          'gads-default' => default_ad_image?,
          hidden: @model == 'AdwordsImage' && @image_data.blank?,
          selected: @selected
        } 
      ],
      data: {
        image_id: @image_data[:id],
        controller: 'image-card',
        image_card_ads_outlet: (parent_form_id if @model == 'AdwordsImage'),
        image_card_user_profile_outlet: (parent_form_id if @model == 'User'),
        image_card_company_profile_outlet: (parent_form_id if @model == 'Company'),
        image_card_story_settings_outlet: (parent_form_id if @model == 'Story'),
        # Forms that do not have a subclass controller:
        image_card_form_outlet: (parent_form_id if @model.in?(%w[Customer])),
        ads_target:,
        story_settings_target: 'ogImageCard',
        action: ('click->image-card#toggleSelected' if @model == 'AdwordsAd') 
      }
    }
  end

  def file_input_attributes
    {
      type: 'file',
      accept: 'image/jpeg,image/png',
      data: {
        image_card_target: 'fileInput',
        s3: (s3_direct_post if @upload_enabled),
        validate: 'false',
        collection: @collection,
        image_type: (@image_data[:type] if @image_data[:type].present?),
        max_file_size: AdwordsImage::MAX_FILE_SIZE,
        min_dimensions: (min_dimensions unless @model == 'Customer'),
        min_width: (min_dimensions[:width] if min_dimensions),
        min_height: (min_dimensions[:height] if min_dimensions),
        aspect_ratio_tolerance: AdwordsImage::ASPECT_RATIO_TOLERANCE,
        required_image: ('true' if @required)
      }
    }
  end

  def image_exists?
    @image_data[:image_url].present? || @image_data[:url].present?
  end

  def image_replaceable?
    @model.in?(%w[User Company Customer Story]) || default_ad_image?
  end

  def default_ad_image?
    @model == 'AdwordsImage' && @image_data[:default]
  end

  def secondary_ad_image?
    @model == 'AdwordsImage' && @image_data[:id].present? && !@image_data[:default]
  end

  def placeholder_url
    if @image_data[:type].present?
      case @image_data[:type]
      when 'SquareImage'
        'https://placehold.co/300/e2e3e3/777?font=open+sans&text=%E2%89%A5%20300%C3%97300'
      when 'LandscapeImage'
        'https://placehold.co/600x314/e2e3e3/777?font=open+sans&text=%E2%89%A5%20600%C3%97314'
      when 'SquareLogo'
        'https://placehold.co/128x128/e2e3e3/777?font=open+sans&text=%E2%89%A5%20128%C3%97128'
      when 'LandscapeLogo'
        'https://placehold.co/512x128/e2e3e3/999?font=open+sans&text=%E2%89%A5%20512%C3%97128'
      when 'OpenGraph'
        'https://placehold.co/1200x630/e2e3e3/777?font=open+sans&text=%E2%89%A5%201200%C3%97630'
      else 
        ''
      end
    elsif @model == 'User'
      asset_url('placeholders/user-photo-missing.png')
    else
      asset_url(LOGO_PLACEHOLDER)
    end
  end

  def s3_direct_post
    post = S3_BUCKET.presigned_post(
      key: "uploads/#{SecureRandom.uuid}/${filename}",
      success_action_status: '201',
      signature_expiration: 1.week.from_now # max expiration setting
    )
    { url: post.url, host: URI.parse(post.url).host, 'postData' => post.fields }
  end
  
  def parent_form_id
    form_ids = {
      'Company' => '#company-profile-form',
      'AdwordsImage' => '#gads-form',
      'User' => '#user-profile-form',
      'Customer' => '#customer-form',
      'Story' => '#story-settings-form'
    }
    form_ids[@model]
  end

  def ads_target
    return nil unless @model == 'AdwordsImage'
    
    if @image_data[:default]
      'defaultImageCard'
    elsif @image_data[:id]
      'imageCard'
    else
      "new#{@collection.singularize.capitalize}Card"
    end
  end

  def alt_text
    @image_data[:type]&.split(/(?=[A-Z])/)&.join(' ')
  end

  def min_dimensions(type = nil)
    min_dimensions = {
      'SquareImage' => {
        width: AdwordsImage::SQUARE_IMAGE_MIN
      },
      'LandscapeImage' => {
        width: AdwordsImage::LANDSCAPE_IMAGE_MIN&.split('x').try(:[], 0).to_i,
        height: AdwordsImage::LANDSCAPE_IMAGE_MIN&.split('x').try(:[], 1).to_i,
        aspect_ratio: AdwordsImage::LANDSCAPE_IMAGE_ASPECT_RATIO
      },
      'SquareLogo' => {
        width: AdwordsImage::SQUARE_LOGO_MIN
      },
      'LandscapeLogo' => {
        width: AdwordsImage::LANDSCAPE_LOGO_MIN&.split('x').try(:[], 0).to_i,
        height: AdwordsImage::LANDSCAPE_LOGO_MIN&.split('x').try(:[], 1).to_i,
        aspect_ratio: AdwordsImage::LANDSCAPE_LOGO_ASPECT_RATIO
      },
      'OpenGraph' => {
        width: 1200,
        height: 630,
        aspect_ratio: 1.91
      }
    }
    type ? min_dimensions[type] : min_dimensions
  end
end
