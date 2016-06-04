module ContributionsHelper

  def contribution_status contribution
    case contribution[:status]
    when 'pre_request'
      return "added #{contribution.created_at.strftime('%-m/%-d/%y')}"
    when 'request'
      return "request sent #{(contribution.remind_at - contribution.remind_1_wait.days).strftime('%-m/%-d/%y')}"
    when 'remind1'
      return "first reminder sent #{(contribution.remind_at - contribution.remind_2_wait.days).strftime('%-m/%-d/%y')}"
    when 'remind2'
      return "second reminder sent #{(contribution.remind_at - contribution.remind_2_wait.days).strftime('%-m/%-d/%y')}"
    when 'did_not_respond'
      return "follow up phone call"
    when 'contribution'
      return 'contribution submitted'
    when 'feedback'
      return 'review feedback'
    when 'unsubscribe'
      return "unsubscribed from story"
    when 'opt_out'
      return "opted out of all emails"
    end
  end

  def display_status? type
    type == 'in-progress' || type == 'next-steps' || type == 'connection'
  end

  def follow_up_required? status
    ['feedback', 'did_not_respond'].include? status
  end

end
