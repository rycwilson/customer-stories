class ContributionRequestsController < ApplicationController

  def create
    @contribution = Contribution.find params[:contribution_id]
    if @contribution.status == 'pre_request'
      new_status = 'request'
      new_remind_at = Time.now + @contribution.remind_1_wait.days
    else
      new_status = 're_send'
      # kind of a hack: remind_at now represents when the request was re-sent
      new_remind_at = Time.now
    end
    request = EmailContributionRequest.new subject: params[:contribution_request][:subject],
                                           body: params[:contribution_request][:body]
    if request.save
      @contribution.email_contribution_request = request
      UserMailer.request_contribution(@contribution).deliver_now
      @contribution.update( status: new_status,
                            remind_at: new_remind_at )
      @contributions_in_progress = Contribution.in_progress @contribution.success_id
      @flash_status = "info"
      @flash_mesg =
        "Request sent to #{@contribution.contributor.full_name}"
    else
      @flash_status = "danger"
      @flash_mesg =
        "Can't send request: #{@contribution.errors.full_messages.join(', ')}"
    end
  end

end
