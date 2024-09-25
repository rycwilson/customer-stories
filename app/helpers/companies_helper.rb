module CompaniesHelper

  def ad_image_card_class_name(ad_image, collection='')
    type_class_name = ad_image[:type]&.split(/(?=[A-Z])/)&.reverse&.join('--')&.downcase&.sub(/\A/, 'gads-')
    if ad_image[:id].blank?
      ad_image[:default] ? 
        "#{type_class_name} gads-default #{ad_image[:type] =~ /Image/ ? 'gads-required' : ''}" :
        "hidden ad-image-card--new gads-#{collection.singularize}"
    else
      "#{type_class_name}" \
      "#{ad_image[:default] ? ' gads-default has-image' : ''}" \
      "#{ad_image[:default] && ad_image[:type] =~ /Image/ ? ' gads-required' : ''}" \
      "#{ad_image[:did_save] ? ' ad-image-card--did-save' : ''}"
    end
  end

  def ad_image_min_dimensions(type=nil)
    min_dimensions = {
      'SquareImage': {
        width: RESPONSIVE_AD_SQUARE_IMAGE_MIN
      },
      'LandscapeImage': {
        width: RESPONSIVE_AD_LANDSCAPE_IMAGE_MIN.split('x')[0].to_i,
        height: RESPONSIVE_AD_LANDSCAPE_IMAGE_MIN.split('x')[1].to_i,
        aspect_ratio: RESPONSIVE_AD_LANDSCAPE_IMAGE_ASPECT_RATIO
      },
      'SquareLogo': {
        width: RESPONSIVE_AD_SQUARE_LOGO_MIN,
      },
      'LandscapeLogo': {
        width: RESPONSIVE_AD_LANDSCAPE_LOGO_MIN.split('x')[0].to_i,
        height: RESPONSIVE_AD_LANDSCAPE_LOGO_MIN.split('x')[1].to_i,
        aspect_ratio: RESPONSIVE_AD_LANDSCAPE_LOGO_ASPECT_RATIO
      }
    }
    type ? min_dimensions[type.to_sym] : min_dimensions
  end

  def ad_image_placeholder(type)
    case type
    when 'SquareImage'
      RESPONSIVE_AD_SQUARE_IMAGE_PLACEHOLDER
    when 'LandscapeImage'
      RESPONSIVE_AD_LANDSCAPE_IMAGE_PLACEHOLDER
    when 'SquareLogo'
      RESPONSIVE_AD_SQUARE_LOGO_PLACEHOLDER
    when 'LandscapeLogo'
      RESPONSIVE_AD_LANDSCAPE_LOGO_PLACEHOLDER
    else 
      ''
    end
  end

end
