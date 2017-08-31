
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
    update_templates_questions(@template, template_params[:contributor_questions_attributes])
    if @template.update(template_params)
      @contributor_questions_grouped_options_select2 =
        contributor_questions_grouped_options_select2(@company, @template)
    end
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
                    .unshift( ['- Create new question -', '0'] ),
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

  def contributor_questions_grouped_options_select2 (company, template)
    unselected_questions = company.contributor_questions - template.contributor_questions
    puts JSON.pretty_generate(unselected_questions)
    [
      {
        text: 'Custom',
        children: unselected_questions
                    .select { |q| q.role.nil? }
                    .map { |q| { id: q.id, text: q.question } }
                    .unshift({ id: 0, text: '- Create new question -' })
      },
      {
        text: 'Role: Customer',
        children: unselected_questions
                    .select { |q| q.role == 'customer' }
                    .map { |q| { id: q.id, text: q.question } }
      },
      {
        text: 'Role: Customer Success',
        children: unselected_questions
                    .select { |q| q.role == 'customer success' }
                    .map { |q| { id: q.id, text: q.question } }
      },
      {
        text: 'Role: Sales',
        children: unselected_questions
                    .select { |q| q.role == 'sales' }
                    .map { |q| { id: q.id, text: q.question } }
      }
    ]
  end

  # method adds a new crowdsourcing_template.contributor_question association
  def update_templates_questions (template, question_params)
    question_params.each do |index, attrs|
      # new association
      if attrs[:id] && template.contributor_questions.find_by(id: attrs[:id]).nil?
        template.contributor_questions << ContributorQuestion.find(attrs[:id])
      end
    end
  end

end
