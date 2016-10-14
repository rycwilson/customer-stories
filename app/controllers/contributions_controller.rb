class ContributionsController < ApplicationController

  before_action :set_contribution_if_valid_token?, only: [:edit, :update]
  before_action :set_contribution, only: [:show, :confirm, :confirm_request, :send_request]
  before_action :check_opt_out_list, only: [:create, :confirm_request]

  respond_to :html, :json

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

  def show
    respond_with @contribution, include: {
          contributor: {}, referrer: {}, success: { include: :customer } }
  end

  #
  # respond_to { |format| format.js }   => this is implied by the request
  #
  def create
    story = Story.find params[:id]
    existing_user = User.find_by email: params[:contributor][:email]
    contributor = existing_user || new_user(params[:contributor])

    # existing user gets a phone number if he doesn't have one already ...
    contributor.phone = params[:contributor][:phone] if params[:contributor][:phone].present?

    if !contributor.changed? || contributor.save  # don't save if not necessary
      contribution = new_contribution story.success.id, contributor.id, params
      if contribution.save
        if contribution.contributor.linkedin_url.present?
          contribution.update(publish_contributor: true)
        end
        # respond with all pre-request contributions, most recent additions first
        @contributions_pre_request = story.contributions_pre_request
        # all contributors needed to populate referrer select box ...
        @contributors = story.success.contributors
        # all contributions to build connections list
        # leave out contributors who unsubscribed or opted out
        @contributions = story.success.contributions
                                      .where("status NOT IN ('unsubscribe', 'opt_out')")
      else
        @flash_status = 'danger'
        @flash_mesg = 'User already has a contribution for this story'
      end
    else
      @flash_status = "danger"
      @flash_mesg = contribution.errors
                      .full_messages
                      .map! do |msg|
                        msg == "User has already been taken" ?
                               "User already has a contribution for this story" : msg
                      end
                      .join(', ')
    end
  end

  #
  # params = { contribution: { status: <type> }, { <type>: <content> } }
  #
  # PUT /contributions/:token
  def update
    # user updates from contribution card (linkedin_url, phone) are sent here
    # instead of registrations_controller so that the update can be made without user password
    # TODO: should be able to make the update without password in registrations_controller,
    # but no big deal for now
    if params[:user]
      contributor = @contribution.contributor
      contributor.update user_params
      respond_to { |format| format.json { respond_with_bip(contributor) } }

    # contribution update from either profile (:publish_contributor, :contributor_unpublished)
    # or contribution card (:publish_contributor OR :notes)
    elsif params[:contribution].length <= 2
      if @contribution.update contribution_params
        respond_to { |format| format.json { render json: true } }  # http://stackoverflow.com/questions/12407328
      else
        # TODO: error
      end

    # contribution submission (via email link) ...
    else
      @contribution.submitted_at = Time.now
      if @contribution.update contribution_params
        UserMailer.alert_contribution_update(@contribution).deliver_now
        if @contribution.publish_contributor? &&
           @contribution.contributor.linkedin_url.blank?
          redirect_to url_for({  # remove the subdomain to avoid csp authentication
                        subdomain: nil,
                        controller: 'profile',
                        action: 'linkedin_connect',
                        params: { contribution_id: @contribution.id }
                      })
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

  # responds with confirm_request.js
  def confirm_request
    curator_missing_info = @contribution.success.curator.missing_info
    if curator_missing_info.empty?
      @request_email = @contribution.generate_request_email
    else
      @flash_status = "danger"
      @flash_mesg =
        "Can't send email because the following Curator fields are missing: #{curator_missing_info.join(', ')}"
    end
  end

  def confirm
    @curator = @contribution.success.curator
  end

  private

  def contribution_params
    params.require(:contribution)
          .permit(:status, :contribution, :feedback, :access_token,
                  :publish_contributor, :contributor_unpublished,
                  :notes, :submitted_at)
  end

  def user_params
    params.require(:user).permit(:linkedin_url, :phone)
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
      @flash_status = "danger"
      @flash_mesg = "Email address has opted out of Customer Stories emails"
      respond_to { |format| format.js }
    else
      true
    end
  end

  def new_user contributor_params
    User.new(first_name: contributor_params[:first_name],
              last_name: contributor_params[:last_name],
                  email: contributor_params[:email],
                  phone: contributor_params[:phone],
             # password is necessary, so just set it to the email
               password: contributor_params[:email],
           sign_up_code: 'csp_beta')
    # Note - skipping confirmation means the user can log in
    #   with these credentials
    # contributor.skip_confirmation!  this is undefined when :confirmable is disabled
  end

  def set_contribution_if_valid_token?
    if @contribution = Contribution.find_by(access_token: params[:token])
      @contribution
    else
      render file: 'public/404.html', status: 404, layout: false
      false
    end
  end

end
