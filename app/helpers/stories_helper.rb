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
      "background-color:#{company.nav_color_1}; color:#{company.nav_text_color}"
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
    if provider == 'all'
      width = '400'
      height = '400'
    elsif provider == 'linkedin'
      width = '300'
      height = '160'
    end
    case company.subdomain
    when 'trunity'
      if provider == 'all'
        image = TRUNITY_400X400_URL
      elsif provider == 'linkedin'
        image = TRUNITY_300X160_URL
      end
    when 'compas'
      if provider == 'all'
        image = COMPAS_400X400_URL
      elsif provider == 'linkedin'
        image = COMPAS_300X160_URL
      end
    when 'corefact'
      if provider == 'all'
        image = COREFACT_400X400_URL
      elsif provider == 'linkedin'
        image = COREFACT_300X160_URL
      end
    when 'varmour'
      if provider == 'all'
        image = VARMOUR_400X400_URL
      elsif provider == 'linkedin'
        image = VARMOUR_300X160_URL
      end
    when 'zoommarketing'
      if provider == 'all'
        image = ZOOM_400X400_URL
      elsif provider == 'linkedin'
        image = ZOOM_300X160_URL
      end
    when 'saucelabs'
      if provider == 'all'
        image = SAUCELABS_400X400_URL
      elsif provider == 'linkedin'
        image = SAUCELABS_300X160_URL
      end
    when 'centerforcustomerengagement'
      if provider == 'all'
        image = CCE_400X400_URL
      elsif provider == 'linkedin'
        image = CCE_300X160_URL
      end
    else
      width = '1200'
      height = '630'
      image = CS_FULL_LOGO_URL
    end
    { image: image, width: width, height: height }
  end

end
