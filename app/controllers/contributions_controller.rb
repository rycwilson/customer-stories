class ContributionsController < ApplicationController

  before_action :set_contribution_if_valid_token?, only: [:edit, :update]
  before_action :set_contribution, only: [:show, :request, :confirm]
  before_action :check_opt_out_list, only: [:confirm_request]

  respond_to(:html, :json, :js)

  def index
    company = Company.find(params[:company_id])
    data = company.contributions.to_json({
              only: [:id, :status], methods: [:display_status],
              include: {
                success: {
                  only: [:id, :name],
                  include: {
                    curator: { only: [:id], methods: [:full_name] },
                    customer: { only: [:id, :name, :slug] },
                    story: { only: [:id, :title, :slug] }
                  }
                },
                contributor: { only: [:id], methods: [:full_name] },
                referrer: { only: [:id], methods: [:full_name] },
                crowdsourcing_template: { only: [:id, :name] },
              }
            })
    pp(JSON.parse(data))
    logger.ap(JSON.parse(data))
    respond_to() { |format| format.json { render({ json: data }) } }
  end

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
      @contribution.update status: 'unsubscribed'
    end
  end

  def show
    if params[:get_contribution_request]
      respond_with(
        @contribution, only: [:id, :request_subject, :request_body],
        include: { contributor: { only: [:email], methods: [:full_name] } }
      )
    else
      respond_with @contribution, include: {
            contributor: {}, referrer: {}, success: { include: :customer } }
    end
  end


  def create
    @contribution = Contribution.create(contribution_params)
    respond_to() { |format| format.js }
  end

  def update
    if params[:send_request]
      # assign any edits to request_subject and request_body
      @contribution.assign_attributes(contribution_params)
      if (UserMailer.contribution_request(@contribution).deliver_now())
        params[:contribution][:status] = 'request_sent'
        @contribution.update(contribution_params)
        respond_to { |format| format.js { render action: 'send_request' } }
      end

    elsif params[:contribution][:contributor]
      @contribution.contributor.update(contribution_params[:contributor])
      respond_to { |format| format.js { render action: 'update_contributor' } }

    elsif params[:contribution][:web_submission]
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

    # contribution update from either profile (:publish_contributor, :contributor_unpublished)
    # or contribution card (:publish_contributor OR :notes)
    else
      if @contribution.update contribution_params
        @contribution.success.story
          .expire_published_contributor_cache(@contribution.contributor.id)
        respond_to { |format| format.json { render json: true } }  # http://stackoverflow.com/questions/12407328
      else
        # TODO: error
      end
    end
  end

  def confirm
    @curator = @contribution.success.curator
  end

  private

  def contribution_params
    params.require(:contribution).permit(
      :user_id, :referrer_id, :success_id, :crowdsourcing_template_id,
      :status, :contribution, :feedback, :publish_contributor,
      :request_subject, :request_body,
      :contributor_unpublished, :notes, :submitted_at,
      contributor_attributes: [:first_name, :last_name, :title, :email, :phone, :linkedin_url, :sign_up_code, :password]
    )
  end

  def set_contribution
    @contribution = Contribution.find(params[:id])
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

  def new_contributor(contribution_params)
    User.new(
      first_name: contribution_params[:contributor_first_name],
      last_name: contribution_params[:contributor_last_name],
      email: contribution_params[:contributor_email],
      # password is necessary, so just set it to the email
      password: contribution_params[:email] || 'password',  # don't want a validation error here
      sign_up_code: 'csp_beta'
    )
    # Note - skipping confirmation means the user can log in
    #   with these credentials
    # contributor.skip_confirmation!  this is undefined when :confirmable is disabled
  end

  def set_contribution_if_valid_token?
    # contributor update
    if params[:token] && (@contribution = Contribution.find_by(access_token: params[:token]))
      @contribution
    # curator update
    elsif request.path.match(/\/contributions\/\d+/)
      @contribution = Contribution.find(params[:id])
    else
      render file: 'public/404.html', status: 404, layout: false
      false
    end
  end

end
