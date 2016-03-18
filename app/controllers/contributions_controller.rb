class ContributionsController < ApplicationController

  include ContributionsHelper

  before_action :valid_token?, only: [:edit, :update]
  before_action :set_contribution, only: [:confirm, :request_contribution]
  before_action :check_opt_out_list, only: [:create, :request_contribution]

  #
  # GET '/contributions/:token/:type'
  #   type is 'contribution', 'feedback', 'unsubscribe', opt_out'
  #
  def edit
    @curator = @contribution.success.curator
    @prompts = @contribution.success.prompts
    contributor_email = @contribution.contributor.email
    @response_type = params[:type]
    if @response_type == 'opt_out'
      unless OptOut.find_by email: contributor_email # already opted out
        OptOut.create email: contributor_email
        # update all contributions for this contributor
        Contribution.update_opt_out_status contributor_email
      end
    elsif @response_type == 'unsubscribe'
      @contribution.update status: 'unsubscribe'
    end
  end

  def create
    story = Story.find params[:id]
    existing_user = User.find_by email: params[:contributor][:email]
    contributor = existing_user || create_contributor(params[:contributor])
    if contributor.save
      contribution = new_contribution(story.success.id, contributor.id, params)
      if contribution.save
        # respond with all pre-request contributions, most recent additions first
        # all contributors needed to populate referrer select box
        @pre_request_contributors = Contribution.pre_request story.success_id
        @contributors = story.success.contributors
      else
        # presently only one validation:
        #   contributor may have only one contribution per success
        @flash_status = "danger"
        @flash_mesg = "That user already has a contribution for this story"
        respond_to { |format| format.js }
      end
    else
      @flash_status = "danger"
      # leave out the last message, as it will refer to password being blank
      @flash_mesg = contributor.errors
                               .full_messages
                               .delete_if do |message|
                                  message == contributor.errors.full_messages.last
                                end
                               .join(', ')
      respond_to { |format| format.js }
    end
  end

  #
  # params = { contribution: { status: <type> }, { <type>: <content> } }
  #
  # PUT /contributions/:token/:type
  def update
    if params[:linkedin_include_profile].present? # from User Profile checkbox
      @contribution.update linkedin: params[:linkedin_include_profile]
      respond_to { |format| format.json { head :ok } }
    else
      if @contribution.update contribution_params
        if @contribution.linkedin? && @contribution.contributor.linkedin_url.blank?
          redirect_to "/auth/linkedin?contribution=#{@contribution.id}"
        else
          redirect_to confirm_contribution_path(@contribution)
        end
      else
        @response_type = params[:contribution][:status]
        @curator = @contribution.success.curator
        @prompts = @contribution.success.prompts
        flash.now[:danger] = @contribution.errors.full_messages.join(', ')
        render :edit
      end
    end
  end

  def request_contribution
    if @contribution.success.curator.photo_url.present?
      UserMailer.request_contribution(@contribution).deliver_now
      if @contribution.update(   status:'request',
                              remind_at: Time.now + @contribution.remind_1_wait.days )
        @contribution_status = contribution_status @contribution.status # view helper
        @flash_status = "info"
        @flash_mesg =
          "An email request for contribution has been sent to #{@contribution.contributor.full_name}"
      else
        @flash_status = "danger"
        @flash_mesg =
          "Error updating Contribution: #{@contribution.errors.full_messages.join(', ')}"
      end
      respond_to { |format| format.js }
    else
      @flash_status = "danger"
      @flash_mesg = "Curator photo is missing"
    end
  end

  def confirm
    @curator = @contribution.success.curator
  end

  private

  def contribution_params
    params.require(:contribution).permit(:status, :contribution, :feedback, :access_token, :linkedin)
  end

  def set_contribution
    @contribution = Contribution.find params[:id]
  end

  def new_contribution success_id, contributor_id, params
    Contribution.new( user_id: contributor_id,
                  referrer_id: params[:contributor][:referrer],
                   success_id: success_id,
                         role: params[:contributor][:role],
                       status: 'pre_request',
                 access_token: SecureRandom.hex )
  end


  def check_opt_out_list
    # contributor email depends on the action (create or update)
    # note: Ruby 2.3 offers .dig method for checking hashes
    contributor_email =
        params[:contributor].try(:[], :email) || Contribution.find(params[:id]).contributor.email
    if OptOut.find_by(email: contributor_email)
      @flash_mesg = "Email address has opted out of Customer Stories emails"
      @flash_status = "danger"
      respond_to { |format| format.js }
    else
      true
    end
  end

  def create_contributor contributor
    User.new(first_name: contributor[:first_name],
              last_name: contributor[:last_name],
                  email: contributor[:email],
             # password is necessary, so just set it to the email
               password: contributor[:email],
           sign_up_code: 'csp_beta')
    # Note - skipping confirmation means the user can log in
    #   with these credentials
    # contributor.skip_confirmation!  this is undefined when :confirmable is disabled
  end

  def valid_token?
    if @contribution = Contribution.find_by(access_token: params[:token])
      @contribution
    else
      render file: 'public/404.html', status: 404, layout: false
      false
    end
  end

end
