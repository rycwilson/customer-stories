module StoriesHelper

  # renders the story's :quote attribute as a <blockquote>
  def story_quote text
    if text
      raw "<em id='story-quote'>" + "\"#{text}\"" + "</em>"
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

end
