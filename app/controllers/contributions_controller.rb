class ContributionsController < ApplicationController

  include ContributionsHelper

  before_action :find_contribution, only:
                          [:contribution_request_email, :edit, :update]

  def contribution_request_email
    if @contribution.update status: 'request1'
      @contributor = User.find @contribution.user_id
      # need to use ContributionsHelper#contribution_status
      # to present a status message based on contribution.status
      @status = contribution_status @contribution.status
      # TODO: Determine status of @contribution and @role (customer, partner, sales) \
      #   -> send appropriate template
      # if first request, kick off cron job for subsequent request emails
      UserMailer.request_contribution(@contribution, @contributor, current_user).deliver_now
      flash.now[:info] =
        "An email request for contribution has been sent to #{user_full_name(@contributor)}"
      respond_to do |format|
        format.js {}
      end
    else
      puts 'error updating contribution'
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
    elsif params[:type] == "opt_out"
      render :opt_out_confirm
    else
      # raise an error
    end
  end

  def create
    story = Story.find params[:id]
    existing_user = User.find_by email: params[:contributor][:email]
    contributor = existing_user || create_new_user(params[:contributor])
    Contribution.create(user_id: contributor.id,
                     success_id: story.success.id,
                           role: params[:contributor][:role],
                         status: 'pre-request')
    # respond with all pre-request contributions, most recent additions first
    @contributors = pre_request_contributors story.success.contributions
    respond_to do |format|
      format.js {}
    end
  end

  # TODO: What if user separately submits contribution and feedback?
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

  def create_new_user contributor
    user = User.new(first_name: contributor[:first_name],
                     last_name: contributor[:last_name],
                         email: contributor[:email],
               # password is necessary, so just set it to the email
                      password: contributor[:email],
                  sign_up_code: 'csp_beta')
    if user.save
      return user
    else
      # TODO raise an exception
    end
  end

  # this method extracts the necessary combination of contribution
  # and contributor data for new contribution AJAX response
  def pre_request_contributors success_contributions
    success_contributions.order(created_at: :desc)
      .select { |contribution| contribution.status == 'pre-request' }
      .map do |contribution|
        {
          contribution_id: contribution.id,
          full_name: contribution.user.first_name + " " + contribution.user.last_name,
          email: contribution.user.email,
          role: contribution.role,
        }
      end
  end

end
