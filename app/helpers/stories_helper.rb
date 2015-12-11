module StoriesHelper

  # renders the story's :quote attribute as a <blockquote>
  def story_quote text
    if text
      raw "<em id='story-quote'>" + "\"#{text}\"" + "</em>"
    else
      "Add a customer quote ..."
    end
  end

  def contribution_status status
    case status
      when 'request1'
        return "Request sent, 3 days remaining"
      when 'request2'
        return "Request sent, 2 days remaining"
      when 'request3'
        return "Request sent, 1 day remaining"
      when 'did_not_respond'
        return "Did not respond"
    end
  end

end
