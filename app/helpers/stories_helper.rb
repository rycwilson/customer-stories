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
  def research_user_query_string user_id, customer_name=nil
    user = User.find_by(id: user_id)
    if customer_name.present?
      user.first_name + "+" + user.last_name + "+" + customer_name
    else
      user.first_name + "+" + user.last_name
    end
  end

end
