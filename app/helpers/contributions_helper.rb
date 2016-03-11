module ContributionsHelper

  def contribution_status status
    label = "Status:&nbsp&nbsp"
    case status
      when 'request'
        return label + "Request sent"
      when 'remind1'
        return label + "First reminder sent"
      when 'remind2'
        return label + "Second reminder sent"
      when 'did_not_respond'
        return label + "Did not respond"
      when 'unsubscribe'
        return label + "Unsubscribed from this story"
      when 'opt_out'
        return label + "Opted out of CSP emails"
    end
  end

end
