module ContributionsHelper

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
