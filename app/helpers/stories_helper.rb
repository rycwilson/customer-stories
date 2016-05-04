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

  def csp_story_path story
    if story.success.products.present?
      public_story_path(story.success.customer.slug,
                        story.success.products.take.slug,
                        story.slug)
    else
      public_story_no_product_path(story.success.customer.slug, story.slug)
    end
  end

  def curator_story_view?
    company_curator? && controller_name == 'stories' && action_name == 'show'
  end

  def gallery_view?
    controller_name == 'stories' && action_name == 'index'
  end

end
