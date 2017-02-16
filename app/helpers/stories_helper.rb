module StoriesHelper

  # method allows for insertion of html into best_in_place textarea
  def story_quote text
    if text
      raw "<em id='story-edit-quote'>" + "\"#{text}\"" + "</em>"
    else
      "Add a customer quote ..."
    end
  end

  # extra parameter is necessary because user not connected to customer
  def research_user_query_string contributor, customer_name=nil
    if customer_name.present?
      contributor.first_name + "+" + contributor.last_name + "+" + customer_name
    else
      contributor.first_name + "+" + contributor.last_name
    end
  end

  def curator_story_view? company_id
    company_curator?(company_id) && controller_name == 'stories' && action_name == 'show'
  end

  def gallery_view?
    controller_name == 'stories' && action_name == 'index'
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

  def grid_item_caption_style company, story
    if story.published?
      "background-color:#{company.header_color_1}; color:#{company.header_text_color}"
    elsif company_curator? company.id
      "background-color:#f5f5f5"
    else
      "visibility:hidden"
    end
  end

  def grid_item_caption_text company_id, story
    if story.published?
      "Read story"
    elsif company_curator? company_id
      story.logo_published? ? "Logo published" : "Pending curation"
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

  def quote_attribution story
    return "" if story.quote_attr.blank?
    story.quote_attr.gsub(',', ",<br>&nbsp;&nbsp;").html_safe
  end

  def og_image company, provider
    provider == 'all' ? (width = '400'; height = '400') :
                        (width = '300'; height = '160') # linkedin
    case company.subdomain
    when 'trunity'
      provider == 'all' ? (image = TRUNITY_400X400_URL) :
                          (image = TRUNITY_300X160_URL) # linkedin
    when 'compas'
      provider == 'all' ? (image = COMPAS_400X400_URL) :
                          (image = COMPAS_300X160_URL) # linkedin
    when 'corefact'
      provider == 'all' ? (image = COREFACT_400X400_URL) :
                          (image = COREFACT_300X160_URL) # linkedin
    when 'varmour'
      provider == 'all' ? (image = VARMOUR_400X400_URL) :
                          (image = VARMOUR_300X160_URL) # linkedin
    when 'zoommarketing'
      provider == 'all' ? (image = ZOOM_400X400_URL) :
                          (image = ZOOM_300X160_URL) # linkedin
    when 'saucelabs'
      provider == 'all' ? (image = SAUCELABS_400X400_URL) :
                          (image = SAUCELABS_300X160_URL) # linkedin
    when 'centerforcustomerengagement'
      provider == 'all' ? (image = CCE_400X400_URL) :
                          (image = CCE_300X160_URL) # linkedin
    else
      width = '1200'
      height = '630'
      image = CS_FULL_LOGO_URL
    end
    { image: image, width: width, height: height }
  end

end
