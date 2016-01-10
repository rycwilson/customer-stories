module ContributionsHelper

  def contribution_status status
    label = "<strong>Status:&nbsp&nbsp</strong>"
    case status
      when 'request'
        return label + "Request sent"
      when 'remind1'
        return label + "First reminder sent"
      when 'remind2'
        return label + "Second reminder sent"
      when 'did_not_respond'
        return label + "Did not respond"
    end
  end

end
