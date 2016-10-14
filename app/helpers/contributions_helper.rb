module ContributionsHelper

  def display_status? type
    type == 'in-progress' || type == 'next-steps' || type == 'connection'
  end

  def follow_up_required? status
    ['feedback', 'did_not_respond'].include? status
  end

  def enable_email_request? contribution, type
    type == 'pre-request' || (contribution.status == 'did_not_respond' && type == 'next-steps')
  end

  def get_contribution_inst_var contribution_id
    @contribution = Contribution.find contribution_id
  end

end
