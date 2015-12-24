module ContributionsHelper

  def contribution_status status
    case status
      when 'request'
        return "Request sent, 3 days remaining"
      when 'remind1'
        return "Request sent, 2 days remaining"
      when 'remind2'
        return "Request sent, 1 day remaining"
      when 'did_not_respond'
        return "Did not respond"
    end
  end

end
