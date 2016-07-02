class ContributionRequestsController < ApplicationController

  def create
    @contribution = Contribution.find params[:contribution_id]
    request = EmailContributionRequest.new subject: params[:contribution_request][:subject],
                                           body: params[:contribution_request][:body]
    if request.save
      @contribution.email_contribution_request = request
      UserMailer.request_contribution(@contribution).deliver_now
      @contribution.update( status:'request',
                            remind_at: Time.now + @contribution.remind_1_wait.days )
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
