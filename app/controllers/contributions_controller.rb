# frozen_string_literal: true

class ContributionsController < ApplicationController
  include SchemaConformable

  before_action :set_contribution, except: %i[index new create]
  # before_action :check_opt_out_list, only: [:confirm_request]
  skip_before_action(
    :verify_authenticity_token,
    only: [:create],
    if: -> { params[:zapier_create].present? }
  )

  respond_to(:html, :json, :js)

  def index
    company = Company.find(params[:company_id]) if params[:company_id].present?
    @success = Success.find(params[:success_id]) if params[:success_id].present?
    @contributions = (@success ? @success.contributions : company.contributions).for_datatable
    respond_to(&:json)
  end

  def new
    @company = Company.find_by(subdomain: request.subdomain)

    # success_id will be 0 if customer win isn't specified in the client
    @success = Success.find_by(id: params[:success_id])
    @customer_id = @success&.customer_id || params[:customer_id]
    @contributor_id = params[:contributor_id]
    @story = @success.story if request.referrer.include?('/stories')
  end

  def show
    respond_to do |format|
      format.html {}
      format.json do
        respond_with(
          @contribution,
          only: %i[id status contribution feedback submitted_at],
          include: {
            customer: { only: [:name] },
            contributor: { only: [:title], methods: [:full_name] },
            invitation_template: { only: [:name] },
            answers: {
              only: %i[answer contributor_question_id],
              include: {
                question: { only: [:question] }
              }
            }
          }
        )
      end
    end
  end

  # GET '/contributions/:token/:type'
  def edit
    @company = Company.find_by(subdomain: request.subdomain)
    @submission_type = params[:type] # type IN ('contribution', 'feedback')
  end

  def create
    # puts JSON.pretty_generate(contribution_params.to_h)
    contribution_attrs = find_dup_customer(contribution_params.to_h.deep_dup, @company)

    %i[referrer_attributes contributor_attributes].each_with_index do |new_user_key, index|
      new_user_attrs = contribution_attrs[new_user_key]
      next unless new_user_attrs.present?

      if (new_user_attrs = find_dup_user(new_user_attrs)).present?
        contribution_attrs[new_user_key] = new_user_attrs
      else
        contribution_attrs.delete(index.to_s)
      end
    end

    # # find an existing sucess
    # if params[:zapier_create] && (success = Success.where(name: contribution_params.to_h[:success_attributes][:name]).take)
    #   params[:contribution][:success_id] = success.id
    #   params[:contribution].delete(:success_attributes)
    # end

    # @contribution = Contribution.new(contribution_params)
    # if @contribution.save
    # else
    #   # this should not be necessary with addition of .find_dup_user
    #   # if @contribution.contributor.errors.full_messages[0] == "Email has already been taken"
    #   #   @contribution.contributor.id = User.find_by(email: @contribution.contributor.email).id
    #   #   @contribution.contributor.reload
    #   #   @contribution.save
    #   # end
    # end
    # if params[:zapier_create].present?
    #   puts "Zapier -> CSP, create contributor (after processing)"
    #   puts contribution_params.to_h
    #   respond_to do |format|
    #     format.any do
    #       render({
    #         json: {
    #           status: @contribution.persisted? ? 'success' : @contribution.errors.full_messages
    #         }
    #       })
    #     end
    #   end
    # else
    #   respond_to { |format| format.js {} }
    # end
    # respond_to { |format| format.js {} }
    redirect_back(
      fallback_location: dashboard_path('prospect'),
      flash: { notice: 'Contributor was added successfully' }
    )
  end

  def update
    puts params.permit(params.keys).to_h

    if params[:data]  # invitation template (datatables inline editor)
      @contribution.invitation_template_id = params[:data].values[0][:invitation_template][:id]
      @contribution.save
      dt_data = [ JSON.parse(@contribution.to_json({
        only: [:id, :status],
        methods: [:display_status, :timestamp],
        include: {
          success: {
            only: [:id, :customer_id, :curator_id, :name],
            include: {
              curator: { only: [:id], methods: [:full_name] },
              customer: { only: [:id, :name, :slug] },
              story: { only: [:id, :title, :published, :slug],
                       methods: [:csp_story_path] }
            }
          },
          contributor: { only: [:id, :email], methods: [:full_name] },
          referrer: { only: [:id], methods: [:full_name] },
          invitation_template: { only: [:id, :name] },
        }
      })) ]
      respond_to do |format|
        format.json do
          render({ json: { data: dt_data }.to_json })
        end
      end

    elsif params[:send_invitation]
      # assign any edits to request_subject and request_body
      @contribution.assign_attributes(contribution_params)
      if ['request_sent', 'request_re_sent'].exclude?(@contribution.status) &&
          UserMailer.contribution_invitation(@contribution).deliver_now
        if @contribution.status == 'pre_request'
          params[:contribution][:status] = 'request_sent'
        elsif @contribution.status == 'did_not_respond'
          params[:contribution][:status] = 'request_re_sent'
        else
          # should not be here!
        end
        @contribution.update(contribution_params)
        respond_to { |format| format.js { render action: 'send_invitation' } }
      else
        # email error or already sent
      end

    elsif params[:contributor]
      @contribution.update(contribution_params)
      # respond_to { |format| format.js { render action: 'update_contributor' } }

    elsif params[:submission]
      # pp contribution_params.to_h
      # if contribution_params[:status] == 'contribution_submitted'
      #   params[:contribution][:contribution] = consolidate_answers(params[:answers])
      # end
      if @contribution.update(contribution_params)
          redirect_to(confirm_submission_path(@contribution.access_token))
        # end
      else
        @submission_type = params[:contribution][:status].split('_')[0]
        flash.now[:danger] = @contribution.errors.full_messages.join(', ')
        render :edit
      end

    elsif %w[opt_out remove].include?(params[:type])
      if params[:type] == 'remove'
        @contribution.update(status: 'removed')
        # NOTE: OptOut is the old model name, original term used for removal
        unless OptOut.find_by(email: @contribution.contributor.email)
          OptOut.create(email: @contribution.contributor.email)
          # update all contributions for this contributor
          Contribution.update_opt_out_status(@contribution.contributor.email)
        end
      else
        @contribution.update(status: 'opted_out')
      end
      render :confirm_opt_out_remove

    elsif contribution_params.to_h.size == 1 and contribution_params.key?(:status)
      if @contribution.update contribution_params
        respond_to do |format|
          format.json { render json: @contribution.to_json(only: [:id, :status], methods: [:display_status]) }
        end
      else
        # TODO handle errors
      end

    elsif contribution_params.to_h.size == 1 and contribution_params.key?(:invitation_template_id)
      if @contribution.update contribution_params
        respond_to do |format| 
          format.json { render json: @contribution.invitation_template.as_json(only: [:id, :name]) }
        end
      else
        # TODO handle errors
      end
    end
  end

  def destroy
    @contribution.destroy
    head(:no_content)
  end

  def confirm
  end

  private

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
      # question = question_id.to_i != 0 ? ContributorQuestion.find(question_id).question : "Additional thoughts"
      question = ContributorQuestion.find(question_id).question
      contribution << "<p style='font-weight:600'>#{question}</p>"
      contribution << "<p><em>#{answer}</em></p>"
    end
    return contribution
  end
end
