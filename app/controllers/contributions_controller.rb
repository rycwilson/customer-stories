class ContributionsController < ApplicationController

  before_action :set_contribution, except: [:index, :create]
  # before_action :check_opt_out_list, only: [:confirm_request]

  respond_to(:html, :json, :js)

  # datatables source data
  def index
    company = Company.find_by(subdomain: request.subdomain)
    data = company.contributions.to_json({
              only: [:id, :status], methods: [:display_status],
              include: {
                success: {
                  only: [:id, :name],
                  include: {
                    curator: { only: [:id], methods: [:full_name] },
                    customer: { only: [:id, :name, :slug] },
                    story: { only: [:id, :title, :published, :slug],
                             methods: [:csp_story_path] }
                  }
                },
                contributor: { only: [:id], methods: [:full_name] },
                referrer: { only: [:id], methods: [:full_name] },
                crowdsourcing_template: { only: [:id, :name] },
              }
            })
    # pp(JSON.parse(data))
    respond_to() { |format| format.json { render({ json: data }) } }
  end

  def show
    if params[:get_contribution_request]
      respond_with(
        @contribution, only: [:id, :request_subject, :request_body, :request_sent_at],
        include: { contributor: { only: [:email], methods: [:full_name] } }
      )
    else
      respond_with @contribution, include: {
            contributor: {}, referrer: {}, success: { include: :customer } }
    end
  end

  # GET '/contributions/:token/:type'
  def edit
    @submission_type = params[:type]  # type IN ('contribution', 'feedback')
  end

  def create
    @contribution = Contribution.create(contribution_params)
    respond_to() { |format| format.js }
  end

  def update
    if params[:data]  # crowdsourcing template (datatables inline editor)
      @contribution.crowdsourcing_template_id =
          params[:data].values[0][:crowdsourcing_template][:id]
      @contribution.save
      dt_data = [ JSON.parse(@contribution.to_json({
        only: [:id, :status], methods: [:display_status],
        include: {
          success: {
            only: [:id, :name],
            include: {
              curator: { only: [:id], methods: [:full_name] },
              customer: { only: [:id, :name, :slug] },
              story: { only: [:id, :title, :published, :slug],
                       methods: [:csp_story_path] }
            }
          },
          contributor: { only: [:id], methods: [:full_name] },
          referrer: { only: [:id], methods: [:full_name] },
          crowdsourcing_template: { only: [:id, :name] },
        }
      })) ]
      respond_to do |format|
        format.json do
          render({ json: { data: dt_data }.to_json })
        end
      end

    elsif params[:send_request]
      # assign any edits to request_subject and request_body
      @contribution.assign_attributes(contribution_params)
      if (UserMailer.contribution_request(@contribution).deliver_now())
        params[:contribution][:status] = 'request_sent'
        @contribution.update(contribution_params)
        respond_to { |format| format.js { render action: 'send_request' } }
      end

    elsif params[:contributor]
      @contribution.update(contribution_params)
      respond_to { |format| format.js { render action: 'update_contributor' } }

    elsif params[:submission]
      if params[:contribution][:status] == 'contribution_submitted'
        params[:contribution][:contribution] = consolidate_answers(params[:answers])
      end
      if @contribution.update(contribution_params)
        if @contribution.publish_contributor? &&
           @contribution.contributor.linkedin_url.blank?
          redirect_to url_for({
            # remove the subdomain to avoid csp authentication
            subdomain: nil,
            controller: 'profile', action: 'linkedin_connect',
            params: { contribution_id: @contribution.id }
          })
        else
          redirect_to(confirm_submission_path(@contribution.access_token))
        end
      else
        @submission_type = params[:contribution][:status].split('_')[0]
        flash.now[:danger] = @contribution.errors.full_messages.join(', ')
        render :edit
      end

    elsif params[:unsubscribe] || params[:opt_out]
      # if @submission_type == 'opt_out'
      #   unless OptOut.find_by email: contributor_email # already opted out
      #     OptOut.create email: contributor_email
      #     # update all contributions for this contributor
      #     Contribution.update_opt_out_status contributor_email
      #   end
      # elsif @submission_type == 'unsubscribe'
      #   @contribution.update(status: 'unsubscribed')
      #   @opt_out_link = url_for({
      #     subdomain: self.company.subdomain,
      #     controller: 'contributions', action: 'update',
      #     token: self.access_token, type: 'opt_out', submission: true
      #   })
      # end


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

  def destroy
    @contribution.destroy
    respond_to do |format|
      format.json { render({ json: @contribution.to_json({ only: [:id] }) }) }
    end
  end

  def confirm
  end

  private

  def contribution_params
    params.require(:contribution).permit(
      :user_id, :referrer_id, :success_id, :crowdsourcing_template_id,
      :status, :contribution, :feedback, :publish_contributor,
      :request_subject, :request_body,
      :contributor_unpublished, :notes, :submitted_at,
      contributor_attributes: [:id, :first_name, :last_name, :title, :email, :phone, :linkedin_url, :sign_up_code, :password]
    )
  end

  def set_contribution
    # contributor
    if params[:token] && (@contribution = Contribution.find_by(access_token: params[:token]))
      @contribution
    # curator
    elsif params[:id] && (@contribution = Contribution.find(params[:id]))
      @contribution
    else
      render file: 'public/404.html', status: 404, layout: false
      false
    end
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


  def consolidate_answers (answers)
    contribution = ""
    answers.each do |question_id, answer|
      question = question_id.to_i != 0 ? ContributorQuestion.find(question_id).question : "Additional thoughts"
      contribution << "<p style='font-weight:600'>#{question}</p>"
      contribution << "<p><em>#{answer}</em></p>"
    end
    return contribution
  end

end
