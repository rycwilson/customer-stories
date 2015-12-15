class ContributionsController < ApplicationController

  before_action :find_contribution, only: [:contribution_request_email, :edit, :update]

  def contribution_request_email
    # TODO: Determine the status of @contribution, send appropriate email template
    # email_template = EmailTemplate.find ...
    # if first request, kick off cron job for subsequent request emails
    UserMailer.request_contribution(@contribution, current_user).deliver
    # @contribution.update status:
    respond_to do |format|
      format.js {}
    end
  end

  def edit
    @curator = current_user  # this is a hack
                             # curator must be logged in
                             # this isn't going to work with cron
    if params[:type] == "feedback"
      @type = "feedback"
    elsif params[:type] == "contribution"
      @type = "contribution"
    else
      render :opt_out_confirm
    end
  end

  def create
    @story = Story.find params[:id]
    @user = User.create(first_name: params[:contributor][:first_name],
                         last_name: params[:contributor][:last_name],
                             email: params[:contributor][:email],
                          # password is necessary, so just set it to the email
                          password: params[:contributor][:email],
                      sign_up_code: 'csp_beta')
    Contribution.create(user_id: @user.id,
                     success_id: @story.success.id,
                           role: params[:contributor][:role],
                         status: 'pre-request')
    # respond with all pre-request contributions, most recent additions first
    @contributors = pre_request_contributors @story.success.contributions
    respond_to do |format|
      format.js {}
    end
  end

  # TODO: What if user submits
  def update
    if @contribution.update contribution_params
      if contribution_params[:opt_out?]
        @type = "opt_out"
        #  notify curator
        render :opt_out_confirm
      elsif contribution_params[:feedback]
        @type = "feedback"
        render :feedback_confirm
      elsif contribution_params[:contribution] #contribution
        @type = "contribution"
        render :contribution_confirm
      else
        puts "Something went wrong"
      end
    else
      render :edit
    end
  end

  def destroy
  end

  private

  # may add more attributes to this list at some point
  # for not, these are the primary changes coming from contributor
  def contribution_params
    params.require(:contribution).permit(:contribution, :feedback, :opt_out?)
  end

  def find_contribution
    @contribution = Contribution.find params[:id]
  end

  # this method extracts the necessary combination of contribution
  # and contributor data for new contributor AJAX response
  def pre_request_contributors success_contributions
    success_contributions.order(created_at: :desc)
      .select { |contribution| contribution.status == 'pre-request' }
      .map do |contribution|
        {
          contribution_id: contribution.id,
          user_name: contribution.user.first_name + " " + contribution.user.last_name,
          user_email: contribution.user.email,
          role: contribution.role,
        }
      end
  end

end
