
class CrowdsourcingTemplatesController < ApplicationController

  before_action() { @company = Company.find(params[:company_id]) }
  before_action({ except: [:new, :create] }) do
    @template = params[:id] == '0' ? nil : CrowdsourcingTemplate.find(params[:id])
  end

  def new
    if params[:copy_template_id].present?
      copy_template = CrowdsourcingTemplate.find(params[:copy_template_id])
      @template = copy_template.dup
      @template.name = 'Copy: ' + copy_template.name
      copy_template.contributor_questions.each { |q| @template.contributor_questions << q }
    else
      @template = CrowdsourcingTemplate.new({ company_id: @company.id })
    end
    render({
      partial: 'companies/settings/crowdsourcing_template_form',
      locals: { company: @company, template: @template, method: 'post',
                url: company_crowdsourcing_templates_path(@company) }
    })
  end

  def show
  end

  def edit
    @template.format_for_editor(current_user)
    render({
      partial: 'companies/settings/crowdsourcing_template_form',
      locals: { company: @company, template: @template, method: 'put',
                template_is_new: params[:new_template].present?,
                url: company_crowdsourcing_template_path(@company, @template) }
    })
  end


  def create
    @template = CrowdsourcingTemplate.new(
        # creating associations in this step will only work when using .build
        # in the new action, but this presupposes the number of questions.
        # Since we want to allow an arbitrary number of associated questions,
        # we'll add them separately below
        template_params.select { |k, v| k != 'contributor_questions_attributes' }
      )
    if @template.save()
      # this adds new question associations - must come before next step
      @template.add_contributor_questions(template_params[:contributor_questions_attributes])
      # this handles creation of new questions
      @template.update(template_params)
      @templates_grouped_select2_options =
        @company.crowdsourcing_templates.grouped_select2_options(@template.id)
      @contributor_questions_grouped_select2_options =
        @company.contributor_questions.grouped_select2_options(@template)
    end
  end

  def update
    @template.add_contributor_questions(template_params[:contributor_questions_attributes])
    if @template.update(template_params)
      @contributor_questions_grouped_select2_options =
        @company.contributor_questions.grouped_select2_options(@template)
    else
      # remove the contributor questions associations
    end
  end

  def destroy
  end

  def test
    template = CrowdsourcingTemplate.new(
                  request_subject: params[:subject],
                  request_body: params[:body]
                )
    template.format_for_storage
    UserMailer.test_template(template, current_user).deliver_now
    respond_to do |format|
      format.json { render json: { flash: "Test email sent to #{current_user.email}" } }
    end
  end

  private

  def template_params
    params.require(:crowdsourcing_template)
          .permit(:name, :request_subject, :request_body, :company_id,
                  { contributor_questions_attributes: [:id, :company_id, :question, :_destroy] })
  end

end
