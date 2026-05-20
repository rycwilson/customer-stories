# frozen_string_literal: true

class ImageCardComponent < ViewComponent::Base
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

  def image_exists?
    @image_data[:image_url].present? || @image_data[:url].present?
  end

  def image_replaceable?
    @model.in?(%w[User Company Customer]) || default_ad_image?
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
    return nil unless @model.in?(%w[User Customer])

    case @model
    when 'User'
      '#user-profile-form'
    when 'Customer'
      '#customer-form'
    end
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
        width: AdwordsAd::RESPONSIVE_AD_SQUARE_IMAGE_MIN
      },
      'LandscapeImage' => {
        width: AdwordsAd::RESPONSIVE_AD_LANDSCAPE_IMAGE_MIN&.split('x').try(:[], 0).to_i,
        height: AdwordsAd::RESPONSIVE_AD_LANDSCAPE_IMAGE_MIN&.split('x').try(:[], 1).to_i,
        aspect_ratio: AdwordsAd::RESPONSIVE_AD_LANDSCAPE_IMAGE_ASPECT_RATIO
      },
      'SquareLogo' => {
        width: AdwordsAd::RESPONSIVE_AD_SQUARE_LOGO_MIN
      },
      'LandscapeLogo' => {
        width: AdwordsAd::RESPONSIVE_AD_LANDSCAPE_LOGO_MIN&.split('x').try(:[], 0).to_i,
        height: AdwordsAd::RESPONSIVE_AD_LANDSCAPE_LOGO_MIN&.split('x').try(:[], 1).to_i,
        aspect_ratio: AdwordsAd::RESPONSIVE_AD_LANDSCAPE_LOGO_ASPECT_RATIO
      }
    }
    type ? min_dimensions[type] : min_dimensions
  end
end
