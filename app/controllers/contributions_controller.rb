class ContributionsController < ApplicationController

  include ContributionsHelper

  before_action :set_contribution, only: :contribution_request_email
  before_action :auth_token, only: [:edit, :update]

  # before_action :update do
  #   auth_token # how to pass the params hash?
  # end

  #
  # GET '/contributions/:id/:token/:type'
  #   type is 'contribution', 'feedback', 'opt_out'
  #
  def edit
    @curator = @contribution.success.curator
    story_example_id = Story.find_example
    @story_example_url = "http://#{ENV['HOST_NAME']}/stories/#{story_example_id}"
    # validate :type
    if ['contribution', 'feedback', 'opt_out'].include? params[:type]
      @response_type = params[:type]
      process_opt_out(@contribution) if (@response_type == 'opt_out')
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
                                     status: 'pre_request',
                               access_token: SecureRandom.hex)
    if contribution.save
      # respond with all pre-request contributions, most recent additions first
      @contributors = Contribution.pre_request story.success_id
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
    if params[:linkedin] # contributor successfully connected to linkedin
      @linkedin_connect = true
      render :confirm_submission
    else
      if @contribution.update contribution_params
        if @contribution.linkedin? && @contribution.user.linkedin_url.nil?
          redirect_to "/auth/linkedin?contribution=#{@contribution.id}"
        else
          render :confirm_submission
        end
      else
        flash.now[:danger] = "Something went wrong"
        render :edit
      end
    end
  end

  def contribution_request_email
    @contributor = @contribution.user
    UserMailer.request_contribution(@contribution, @contributor).deliver_now
    if @contribution.update(   status:'request',
                            remind_at: Time.now + @contribution.remind_1_wait.days )
      @status = contribution_status @contribution.status # view helper
      # TODO: start cron job for reminder emails and token expiration
      flash.now[:info] =
        "An email request for contribution has been sent to #{@contributor.full_name}"
      respond_to do |format|
        format.js {}
      end
    else
      redirect_to edit_story_path(@contribution.success.story),
        flash[:alert] = "Something went wrong"
    end
  end

  private

  def contribution_params
    params.require(:contribution).permit(:status, :contribution, :feedback, :access_token, :linkedin)
  end

  def set_contribution
    @contribution = Contribution.find params[:id]
  end

  def generate_token

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

  def auth_token
    if @contribution = Contribution.find_by(access_token: params[:token])
      @contribution
    else
      render file: 'public/404.html', status: 404, layout: false
      false
    end
  end

end
