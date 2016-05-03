class ContributionsController < ApplicationController

  include ContributionsHelper

  before_action :valid_token?, only: [:edit, :update]
  before_action :set_contribution, only: [:show, :confirm, :request_contribution]
  before_action :check_opt_out_list, only: [:create, :request_contribution]

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
        # respond with all pre-request contributions, most recent additions first
        @contributions_pre_request = Contribution.pre_request story.success_id
        # all contributors needed to populate referrer select box ...
        @contributors = story.success.contributors
        # all contributions to build connections list
        # leave out contributors who unsubscribed or opted out
        @contributions = story.success.contributions
                                      .where("status NOT IN ('unsubscribe', 'opt_out')")
      else
        # presently only one validation:
        #   contributor may have only one contribution per success
        @flash_status = "danger"
        @flash_mesg = "That user already has a contribution for this story"
      end
    else
      @flash_status = "danger"
      @flash_mesg = contributor.errors
                               .full_messages
                               .delete_if { |message| message == "Password can't be blank" }
                               .join(', ')
    end
  end

  #
  # params = { contribution: { status: <type> }, { <type>: <content> } }
  #
  # PUT /contributions/:token
  def update
    if params[:user] # contributor update coming from contribution card
      if params[:user][:linkedin_url]
        @contribution.contributor.update linkedin_url: params[:user][:linkedin_url]
        # update unless already true
        @contribution.update(linkedin: true) unless @contribution.linkedin?
        # set false if blank linkedin url submitted
        @contribution.update(linkedin: false) if params[:user][:linkedin_url].blank?
      elsif params[:user][:phone]
        @contribution.contributor.update phone: params[:user][:phone]
      end
      respond_to { |format| format.json { head :ok } }
    elsif params[:contribution].try(:[], :notes)  # notes coming from contribution cards
      @contribution.update notes: params[:contribution][:notes]
      respond_to { |format| format.json { head :ok } }
    elsif params[:linkedin_include_profile].present? # from User Profile checkbox
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

  # respond_to { |format| format.js }
  def request_contribution
    curator_missing_info = @contribution.success.curator.missing_info
    if curator_missing_info.empty?
      UserMailer.request_contribution(@contribution).deliver_now
      if @contribution.update(   status:'request',
                              remind_at: Time.now + @contribution.remind_1_wait.days )
        @contributions_in_progress = Contribution.in_progress @contribution.success_id
        @flash_status = "info"
        @flash_mesg =
          "An email request for contribution has been sent to #{@contribution.contributor.full_name}"
      else
        @flash_status = "danger"
        @flash_mesg =
          "Error updating Contribution: #{@contribution.errors.full_messages.join(', ')}"
      end
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
    params.require(:contribution).permit(:status, :contribution, :feedback, :access_token, :linkedin, :notes)
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

  def valid_token?
    if @contribution = Contribution.find_by(access_token: params[:token])
      @contribution
    else
      render file: 'public/404.html', status: 404, layout: false
      false
    end
  end

end
