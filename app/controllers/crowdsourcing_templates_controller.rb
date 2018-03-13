
class CrowdsourcingTemplatesController < ApplicationController

  before_action() { @company = Company.find(params[:company_id]) }
  before_action({ except: [:new, :create] }) do
    unless params[:restore].present?
      @template = params[:id] == '0' ? nil : CrowdsourcingTemplate.find(params[:id])
    end
  end

  def new
    if params[:source_template_id].present?
      source_template = CrowdsourcingTemplate.find(params[:source_template_id])
      @template = source_template.dup
      @template.name = 'Copy: ' + source_template.name
      source_template.contributor_questions.each { |q| @template.contributor_questions << q }
    else
      @template = CrowdsourcingTemplate.new({ company_id: @company.id })
    end
    render({
      partial: 'companies/settings/crowdsourcing_template_form',
      locals: { company: @company, template: @template, method: 'post',
                template_is_new: false, template_is_copy: params[:source_template_id].present?,
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
                template_is_new: params[:new_template].present?, template_is_copy: false,
                url: company_crowdsourcing_template_path(@company, @template) }
    })
  end

  def create
    @template = CrowdsourcingTemplate.create(template_params)
  end

  def update
    if params[:restore]
      restore_templates(JSON.parse(params[:id]))
      @needs_refresh = params[:needs_refresh]
      @selected_or_all = JSON.parse(params[:id]).length == 1 ? 'selected' : 'all'
      respond_to { |format| format.js { render action: 'restore' } }
    else
      @template.update(template_params)
    end
  end

  def destroy
    @template.destroy
  end

  private

  def template_params
    params.require(:crowdsourcing_template)
      .permit(
        :name, :request_subject, :request_body, :company_id, :contribution_page_title, :feedback_page_title,
        { templates_questions_attributes: [:id, :crowdsourcing_template_id, :contributor_question_id, :_destroy] },
        { contributor_questions_attributes: [:id, :company_id, :question] }
      )
  end

  def restore_templates (template_ids)
    factory_defaults = Company.find_by(name:'CSP').crowdsourcing_templates
    template_ids.each() do |template_id|
      template = CrowdsourcingTemplate.find(template_id)
      default = factory_defaults.find() { |t| t.name == template.name }
      template.update({
        request_subject: default.request_subject,
        request_body: default.request_body
      })
      template.contributor_questions.delete_all()
      default.contributor_questions.each() { |q| template.contributor_questions << q }
    end
  end

end
