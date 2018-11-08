module StoriesHelper

  def linkedin_widget_width (window_width)
    case window_width.to_i
    when 0...370
      '340'
    when 370...500
      (window_width.to_i - 30).to_s  # 30 = padding * 2
    when 500...768
      '470'
    when 768...992
      '330'
    when 992...1200
      '360'
    else
      '436'
    end
  end

  def stories_header_title_width (company)
    if curator?(company) && current_page?(action: 'index')
      'col-sm-6'
    elsif curator?(company) && current_page(action: 'show')
      # leave room for Edit Story button
      'col-sm-5'
    elsif company.category_tags.blank? && company.product_tags.blank?
      'col-sm-6'
    else
      'col-sm-12'
    end
  end

  def curator_story_view? (company_id)
    company_curator?(company_id) && controller_name == 'stories' && action_name == 'show'
  end

  def primary_cta_style (company)

    "position: relative; background-color:#{company.primary_cta_background_color}; color:#{company.primary_cta_text_color}"
  end

  def include_filters? (company)
    include_category_filter?(company) || include_product_filter?(company)
  end

  def include_category_filter? (company)
    company.story_categories.public_select_options.length > 1
  end

  def include_product_filter? (company)
    company.products.public_select_options.length > 1
  end

  def csp_landing
    if ENV['HOST_NAME'] == 'customerstories.net'
      'https://customerstories.net'
    elsif ENV['HOST_NAME'] == 'customerstories.org'
      'https://customerstories.org'
    else
      'http://lvh.me:3000'
    end
  end

  def grid_item_link company_id, story
    if story.published?
      story.csp_story_path
    elsif company_curator? company_id
      edit_story_path story.id
    else
      "javascript:;"
    end
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

  def og_image company, provider
    provider == 'all' ? (width = '400'; height = '400') : (width = '300'; height = '160') # linkedin
    case company.subdomain
    when 'trunity'
      provider == 'all' ? (image = TRUNITY_400X400_URL) : (image = TRUNITY_300X160_URL) # linkedin
    when 'compas'
      provider == 'all' ? (image = COMPAS_400X400_URL) : (image = COMPAS_300X160_URL) # linkedin
    when 'corefact'
      provider == 'all' ? (image = COREFACT_400X400_URL) : (image = COREFACT_300X160_URL) # linkedin
    when 'varmour'
      provider == 'all' ? (image = VARMOUR_400X400_URL) : (image = VARMOUR_300X160_URL) # linkedin
    when 'zoommarketing'
      provider == 'all' ? (image = ZOOM_400X400_URL) : (image = ZOOM_300X160_URL) # linkedin
    when 'saucelabs'
      provider == 'all' ? (image = SAUCELABS_400X400_URL) : (image = SAUCELABS_300X160_URL) # linkedin
    when 'centerforcustomerengagement'
      provider == 'all' ? (image = CCE_400X400_URL) : (image = CCE_300X160_URL) # linkedin
    when 'zeniq'
      provider == 'all' ? (image = ZENIQ_400X400_URL) : (image = ZENIQ_300X160_URL) # linkedin
    when 'retailnext'
      provider == 'all' ? (image = RETAILNEXT_400X400_URL) : (image = RETAILNEXT_300X160_URL) # linkedin
    when 'smartpaymentplan'
      provider == 'all' ? (image = SPP_400X400_URL) : (image = SPP_300X160_URL)
    when 'pixlee'
      provider == 'all' ? (image = PIXLEE_400X400_URL) : (image = PIXLEE_300X160_URL)
    else
      width = '1200'
      height = '630'
      image = CS_FULL_LOGO_URL
    end
    { image: image, width: width, height: height }
  end

end
