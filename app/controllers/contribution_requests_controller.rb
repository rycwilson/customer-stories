class ContributionRequestsController < ApplicationController

  def create
    @contribution = Contribution.find params[:contribution_id]
    story = @contribution.success.story
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
      # see below for what email via sendgrid mail api might look like
      @contribution.update( status: new_status,
                            remind_at: new_remind_at )
      @contributions_in_progress = story.contributions_in_progress
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

# send_mail_request = Typhoeus::Request.new(
#   SG_SEND_URL,
#   method: :post,
#   body: {
#     personalizations: [
#       {
#         to: [
#           {
#             email: "***REMOVED***"
#           }
#         ],
#         subject: "sendgrid api test"
#       }
#     ],
#     from: {
#       email: "***REMOVED***"
#     },
#     content: [
#       {
#         type: "text/html",
#         value: "Hello, World!"
#       }
#     ],
#     tracking_settings: {
#       open_tracking: { enable: true }
#     },
#     custom_args: { foo: 'bar' }
#   }.to_json,
#   headers: { Authorization: "Bearer #{ENV['SENDGRID_APIKEY']}",
#              "Content-Type" => "application/json" }
# )
# # logger.debug "SENDGRID REQUEST"
# # logger.debug "#{send_mail_request}"
# send_mail_request.run
# logger.debug "SENDGRID RESPONSE"
# logger.debug "#{send_mail_request.response.code}"
# logger.debug "#{send_mail_request.response.total_time}"
# logger.debug "#{send_mail_request.response.headers}"
# logger.debug "#{send_mail_request.response.body}"
