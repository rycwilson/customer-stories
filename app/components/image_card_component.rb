# frozen_string_literal: true

class ImageCardComponent < ViewComponent::Base
  # For smaller templates, ok to define them here:
  # slim_template <<-SLIM
  # (Remember to escape interpolated strings)
  # SLIM

  renders_one :header_actions
  renders_many :form_controls
  renders_one :footer_actions

  def initialize(
    model,
    image_object: {},
    form_controller_id: nil,
    form_controller_target: '',
    collection: nil,
    uploadable: true,
    required: false,
    selectable: false,
    selected: false
  )
    if image_object[:type].present? && !collection
      collection = image_object[:type].split(/(?=[A-Z])/).last.downcase.pluralize
    end
    @model = model
    @image_object = image_object
    @form_controller_id = form_controller_id
    @form_controller_target = form_controller_target
    @required = required
    @collection = collection
    @uploadable = uploadable
    @selectable = selectable
    @selected = selected
  end

  def image_exists?
    @image_object[:image_url].present? || @image_object[:url].present?
  end

  def fileinput_widget_attributes
    return {} unless @uploadable

    {
      class: "fileinput fileinput-#{image_exists? ? 'exists' : 'new'}",
      data: { image_card_target: 'fileInputWidget' }
    }
  end

  def placeholder_url
    if @image_object[:type].present?
      case @image_object[:type]
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

  def checkmark_html
    <<~HTML.squish
      <div class="image-card__checkmark">
        <div>
          <div></div>
          <span class="fa-stack fa-lg">
            <i class="fa fa-circle-o fa-stack-2x"></i>
            <i class="fa fa-check fa-stack-1x"></i>
          </span>
        </div>
      </div>
    HTML
  end

  def asset_host
    Rails.application.config.asset_host if @uploadable && Rails.env.production?
  end

  def s3_direct_post
    post = S3_BUCKET.presigned_post(
      key: "uploads/#{SecureRandom.uuid}/${filename}",
      success_action_status: '201',
      signature_expiration: 1.week.from_now # max expiration setting
    )
    { url: post.url, host: URI.parse(post.url).host, 'postData' => post.fields }
  end

  def alt_text
    @image_object[:type]&.split(/(?=[A-Z])/)&.join(' ')
  end

  # TODO: Despite the nil default, a type should always be passed
  def min_dimensions(type = nil)
    return nil if !@uploadable || @model == 'Customer'

    min_dimensions = {
      'UserPhoto' => {
        width: 400
      },
      'OpenGraph' => {
        width: 1200,
        height: 630
      },
      'SquareImage' => {
        width: AdwordsImage::SQUARE_IMAGE_MIN
      },
      'LandscapeImage' => {
        width: AdwordsImage::LANDSCAPE_IMAGE_MIN&.split('x').try(:[], 0).to_i,
        height: AdwordsImage::LANDSCAPE_IMAGE_MIN&.split('x').try(:[], 1).to_i
      },
      'SquareLogo' => {
        width: AdwordsImage::SQUARE_LOGO_MIN
      },
      'LandscapeLogo' => {
        width: AdwordsImage::LANDSCAPE_LOGO_MIN&.split('x').try(:[], 0).to_i,
        height: AdwordsImage::LANDSCAPE_LOGO_MIN&.split('x').try(:[], 1).to_i
      }
    }

    min_dimensions.each_key do |k| 
      # For square images, fill in the height key.
      min_dimensions[k]
        .merge!(min_dimensions[k][:height] ? {} : { height: min_dimensions[k][:width] })
      
      # All images have a common aspect ratio tolerance.
      min_dimensions[k].merge!({ tolerance: AdwordsImage::ASPECT_RATIO_TOLERANCE })
    end

    if type
      min_dimensions[type]
    else
      min_dimensions.select do |type, _|
        type.in? %w[SquareImage LandscapeImage SquareLogo LandcapeLogo]
      end
    end
  end
end
