module CompaniesHelper

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
      'https://dummyimage.com/142/e2e3e3/3c3c3c&text=%E2%89%A5%20300%C3%97300'
      # RESPONSIVE_AD_SQUARE_IMAGE_PLACEHOLDER
    when 'LandscapeImage'
      'https://dummyimage.com/195x102/e2e3e3/3c3c3c&text=%E2%89%A5%20600%C3%97314'
      # RESPONSIVE_AD_LANDSCAPE_IMAGE_PLACEHOLDER
    when 'SquareLogo'
      'https://dummyimage.com/117/e2e3e3/3c3c3c&text=%E2%89%A5%20128%C3%97128'
      # RESPONSIVE_AD_SQUARE_LOGO_PLACEHOLDER
    when 'LandscapeLogo'
      'https://dummyimage.com/232x58/e2e3e3/3c3c3c&text=%E2%89%A5%20512%C3%97128'
      # RESPONSIVE_AD_LANDSCAPE_LOGO_PLACEHOLDER
    else 
      ''
    end
  end

end
