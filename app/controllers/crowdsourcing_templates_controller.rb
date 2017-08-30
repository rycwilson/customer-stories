
class CrowdsourcingTemplatesController < ApplicationController

  before_action({ only: [:edit, :update] }) { @company = Company.find(params[:company_id]) }
  before_action() { @template = params[:id] == '0' ? nil : CrowdsourcingTemplate.find(params[:id]) }

  def show
  end

  def edit
    @template.format_for_editor(current_user)
    render({
      partial: 'companies/settings/crowdsourcing_template_form',
      locals: { company: @company, template: @template,
                contributor_questions_grouped_options:
                contributor_questions_grouped_options(@company, @template) }
    })
  end

  def create
  end

  def update
    # binding.remote_pry
    # update_templates_questions_associations(@template, template_params)
    # add and remove associations
    # @template.contributor_questions.find_by(id)
    @template.update(template_params)
  end

  def destroy
  end

  private

  def template_params
    params.require(:crowdsourcing_template)
          .permit(:name, :request_subject, :request_body,
                  { contributor_questions_attributes: [:id, :company_id, :question, :_destroy] })
  end

  def contributor_questions_grouped_options (company, template)
    unselected_questions = company.contributor_questions - template.contributor_questions
    {
      'Custom' => unselected_questions
                    .select { |q| q.role.nil? }
                    .map { |q| [q.question, q.id] }
                    .unshift( ['Create new question', '0'] ),
      'Role: Customer' => unselected_questions
                            .select { |q| q.role == 'customer' }
                            .map { |q| [q.question, q.id] },
      'Role: Customer Success' => unselected_questions
                                    .select { |q| q.role == 'customer success' }
                                    .map { |q| [q.question, q.id] },
      'Role: Sales' => unselected_questions
                          .select { |q| q.role == 'sales' }
                          .map { |q| [q.question, q.id] },
    }
  end

  # def update_templates_questions_associations (template, template_params)
  #   template_params[:contributor_questions_attributes].each do |question|
  #     # new association
  #     if question[:id] && template.contributor_questions.find_by(id).nil?

  # end

end
