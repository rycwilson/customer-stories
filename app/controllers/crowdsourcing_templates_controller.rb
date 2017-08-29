
class CrowdsourcingTemplatesController < ApplicationController

  before_action({ only: [:edit] }) { @company = Company.find(params[:company_id]) }
  before_action() { @template = params[:id] == '0' ? nil : CrowdsourcingTemplate.find(params[:id]) }

  def show
  end

  def edit
    @template.format_for_editor(current_user)
    render({
      partial: 'companies/settings/crowdsourcing_template_form',
      locals: { company: @company, template: @template }
    })
  end

  def create
  end

  def update
    @template.update(template_params)
  end

  def destroy
  end

  private

  def template_params
    params.require(:crowdsourcing_template)
          .permit(:name, :request_subject, :request_body,
                  { contributor_questions_attributes: [:id, :question, :_destroy] })
  end

end
