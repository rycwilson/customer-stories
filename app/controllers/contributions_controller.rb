class ContributionsController < ApplicationController

  include ContributionsHelper

  before_action :find_contribution, only:
                          [:contribution_request_email, :edit, :update]

  def contribution_request_email
    @contributor = @contribution.user
    UserMailer.request_contribution(@contribution, @contributor).deliver_now
    if @contribution.update status:'request'
      @status = contribution_status @contribution.status # view helper
      # TODO: start cron job for reminder emails and token expiration
      flash.now[:info] =
        "An email request for contribution has been sent to #{user_full_name(@contributor)}"
      respond_to do |format|
        format.js {}
      end
    else
      redirect_to edit_story_path(@contribution.success.story),
        flash[:alert] = "Something went wrong"
    end
  end

  #
  # GET '/contributions/:id/:type'
  #   type is 'contribution', 'feedback', 'opt_out'
  #
  def edit
    @curator = @contribution.success.curator
    # validate :type
    if ['contribution', 'feedback', 'opt_out'].include? params[:type]
      @type = params[:type]
      process_opt_out(@contribution) if (@type == 'opt_out')
    else
      # page doesn't exist
    end
  end

  def create
    story = Story.find params[:id]
    existing_user = User.find_by email: params[:contributor][:email]
    contributor = existing_user || create_new_user(params[:contributor])
    contribution = Contribution.new(user_id: contributor.id,
                                 success_id: story.success.id,
                                       role: params[:contributor][:role],
                                     status: 'pre_request')
    if contribution.save
      # respond with all pre-request contributions, most recent additions first
      @contributors = pre_request_contributors story.success.contributions
      respond_to do |format|
        format.js {}
      end
    else
      puts 'Error saving contribution: ' + contribution.errors.full_messages
    end
  end

  #
  # params = { contribution: { status: <type> }, { <type>: <content> } }
  #
  # TODO: after submission, update (change? delete?) the contributor's token
  #
  def update
    if @contribution.update contribution_params
      render :confirm_submission
    else
      flash.now[:danger] = "Something went wrong"
      render :edit
    end
  end

  def destroy
  end

  private

  def contribution_params
    params.require(:contribution).permit(:status, :contribution, :feedback)
  end

  def find_contribution
    @contribution = Contribution.find params[:id]
  end

  def process_opt_out contribution
    # TODO: process opt_out request
  end

  def create_new_user contributor
    user = User.new(first_name: contributor[:first_name],
                     last_name: contributor[:last_name],
                         email: contributor[:email],
               # password is necessary, so just set it to the email
                      password: contributor[:email],
                  sign_up_code: 'csp_beta')
    # Note - skipping confirmation means the user can log in
    #   with these credentials
    # user.skip_confirmation!  this is undefined when :confirmable is disabled
    if user.save
      user
    else
      puts 'error creating contributor'
    end
  end

  # this method extracts the necessary combination of contribution
  # and contributor data for new contribution AJAX response
  def pre_request_contributors success_contributions
    success_contributions.order(created_at: :desc)
      .select { |contribution| contribution.status == 'pre_request' }
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
