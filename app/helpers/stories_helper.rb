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
  def research_user_query_string user, customer
    user = User.find_by(id: user.id)
    user.first_name + "+" + user.last_name + "+" + customer.name
  end

end
