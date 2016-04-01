module ContributionsHelper

  def contribution_status contribution
    case contribution[:status]
      when 'request'
        return "request sent #{(contribution[:remind_at] - contribution[:remind_1_wait].days).strftime('%-m/%-d/%y')}"
      when 'remind1'
        return "first reminder sent #{(contribution[:remind_at] - contribution[:remind_2_wait].days).strftime('%-m/%-d/%y')}"
      when 'remind2'
        return "second reminder sent #{(contribution[:remind_at] - contribution[:remind_2_wait].days).strftime('%-m/%-d/%y')}"
      when 'did_not_respond'
        return "did not respond"
      when 'unsubscribe'
        return "unsubscribed from story"
      when 'opt_out'
        return "opted out of all emails"
    end
  end

end
