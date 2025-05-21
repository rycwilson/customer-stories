module StoriesHelper

  def company_header_logo_url(company)
    if company.header_logo_type == 'SquareLogo' && company.square_logo_url.present?
      company.square_logo_url
    elsif company.header_logo_type == 'LandscapeLogo' && company.landscape_logo_url.present?
      company.landscape_logo_url
    else
      company.logo_url || LOGO_PLACEHOLDER
    end
  end
  
  def disallow_search_indexing?(company=nil)
    staging? || company&.subdomain == 'pixlee'
  end

  # this is for PDF generation
  # ref: https://github.com/mileszs/wicked_pdf/issues/36
  def embed_remote_image(url, content_type)
    asset = open(url, "r:UTF-8") { |f| f.read }
    base64 = Base64.encode64(asset.to_s).gsub(/\s+/, "")
    "data:#{content_type};base64,#{Rack::Utils.escape(base64)}"
  end

  def meta_keywords success
    keywords = success.story_categories.pluck('name').push << success.products.pluck('name')
    keywords.present? ? keywords.join(', ') : ''
  end

  def og_image(company, provider='all-providers')
    width, height = (provider == 'linkedin') ? ['300', '160'] : ['400', '400']
    # case company.subdomain
    # when 'trunity'
    #   image = (provider == 'linkedin') ? TRUNITY_300X160_URL : TRUNITY_400X400_URL
    # when 'compas'
    #   image = (provider == 'linkedin') ? COMPAS_300X160_URL : COMPAS_400X400_URL
    # when 'corefact'
    #   image = (provider == 'linkedin') ? COREFACT_300X160_URL : COREFACT_400X400_URL
    # when 'varmour'
    #   image = (provider == 'linkedin') ? VARMOUR_300X160_URL : VARMOUR_400X400_URL
    # when 'zoommarketing'
    #   image = (provider == 'linkedin') ? ZOOM_300X160_URL : ZOOM_400X400_URL
    # when 'saucelabs'
    #   image = (provider == 'linkedin') ? SAUCELABS_300X160_URL : SAUCELABS_400X400_URL
    # when 'centerforcustomerengagement'
    #   image = (provider == 'linkedin') ? CCE_300X160_URL : CCE_400X400_URL
    # when 'zeniq'
    #   image = (provider == 'linkedin') ? ZENIQ_300X160_URL : ZENIQ_400X400_URL
    # when 'retailnext'
    #   image = (provider == 'linkedin') ? RETAILNEXT_300X160_URL : RETAILNEXT_400X400_URL
    # when 'smartpaymentplan'
    #   image = (provider == 'linkedin') ? SPP_300X160_URL : SPP_400X400_URL
    # when 'pixlee'
    #   image = (provider == 'linkedin') ? SAUCELABS_300X160_URL : SAUCELABS_400X400_URL
    # else
    #   # width = '1200'
    #   # height = '630'
    #   # image = CS_FULL_LOGO_URL
    # end
    if Rails.env.development? 
      {}
    elsif %w(trunity compas corefact varmour zoommarketing saucelabs centerforcustomerengagement zeniq retailnext smartpaymentplan pixlee) 
      .include?(company.subdomain)
      { 
        image: asset_url("companies/#{company.subdomain}/#{provider == 'linkedin' ? 'og_300x160.png' : 'og_400x400.png'}"), 
        width: width, 
        height: height 
      }
    else 
      {
        image: asset_url('cs_logo_full_1200x630.png'),
        width: '1200',
        height: '630'
      }
    end
  end

  def stories_header_class(company)
    "stories-header stories-header--#{company.subdomain} stories-header--bg-#{color_shade(company.header_color_2)}"
  end

  def stories_header_custom_colors(company)
    "background-color: #{company.header_color_2}; color: #{company.header_text_color}"
  end

  def story_card_class(story, is_dashboard: false, is_plugin: false, logos_only: false, is_grayscale: false, preselected_story_id: nil)
    [
      'story-card',
      "story-card--#{story.company.subdomain}",
      "story-card--#{story.status}",
      is_dashboard ? 'story-card--dashboard story-card--small' : '',
      is_plugin ? 'story-card--plugin' : '',
      preselected_story_id == story.id ? 'cs-loaded' : '',
      logos_only ? 'story-card--logo-only' : 'story-card--card',
      is_grayscale ? 'story-card--grayscale' : '',
    ].join(' ')
  end

end
