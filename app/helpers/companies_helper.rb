module CompaniesHelper
  def invitation_template_select_escaped_html company
    escape_once(render('invitation_templates/inline_select', { company: }))
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
  end

end
