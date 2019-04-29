module CompaniesHelper

  def ad_image_card_class_name(ad_image)
    case ad_image[:type]
    when 'SquareLogo'
      "gads-logo gads-logo--square #{ ad_image[:default] ? 'gads-default' : '' }"
    when 'LandscapeLogo'
      "gads-logo gads-logo--landscape #{ ad_image[:default] ? 'gads-default' : '' }"
    when "SquareImage"
      "gads-image gads-image--square #{ ad_image[:default] ? 'gads-default gads-required' : '' }"
    when "LandscapeImage"
      "gads-image gads-image--landscape #{ ad_image[:default] ? 'gads-default gads-required' : '' }"
    end
  end

  def ad_image_min_dimensions(type)
    case type
    when 'SquareImage'
      RESPONSIVE_AD_SQUARE_IMAGE_MIN
    when 'LandscapeImage'
      RESPONSIVE_AD_LANDSCAPE_IMAGE_MIN
    when 'SquareLogo'
      RESPONSIVE_AD_SQUARE_LOGO_MIN
    when 'LandscapeLogo'
      RESPONSIVE_AD_LANDSCAPE_LOGO_MIN
    end
  end

  def gads_logos_index_offset(company, offset)
    (company.adwords_images.marketing.length + 2 - company.adwords_images.marketing.default.length + offset).to_s
  end

end
