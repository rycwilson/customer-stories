# frozen_string_literal: true

class InvitationTemplatesController < ApplicationController
  before_action(:set_company)
  before_action({ except: %i[index new create] }) do
    unless params[:restore].present?
      @template = params[:id] == '0' ? nil : InvitationTemplate.find(params[:id])
    end
  end

  def index
    respond_to do |format|
      format.json do
        render(json: @company.invitation_templates.to_json(only: %i[id name]))
      end
    end
  end

  def new
    if params[:source_template_id].present?
      source_template = @company.invitation_templates.find_by(id: params[:source_template_id])
      @template = source_template.dup
      @template.name = "Copy: #{source_template.name}"
    else
      @template = @company.invitation_templates.build
    end
  end

  def show; end

  def edit
    @template = @company.invitation_templates.find(params[:id])&.format_for_editor(current_user)
  end

  def create
    @template = @company.invitation_templates.new template_params
    if @template.save
      flash.now[:notice] =
        "Template &nbsp;<strong>#{@template.name}</strong>&nbsp; was created".html_safe
      render :edit
    else
      @errors = @template.errors.full_messages
      render :new
    end
  end

  def update
    if params[:restore]
      restore_templates(JSON.parse(params[:id]))
      @needs_refresh = params[:needs_refresh]
      @selected_or_all = JSON.parse(params[:id]).length == 1 ? 'selected' : 'all'
      respond_to { |format| format.js { render action: 'restore' } }
    elsif @template.update template_params
      flash.now[:notice] =
        "Template &nbsp;<strong>#{@template.name}</strong>&nbsp; was updated".html_safe
    else
      @errors = @template.errors.full_messages
    end
    render :edit
  end

  def destroy
    @template.destroy
    flash.now[:notice] =
      "Template &nbsp;<strong>#{@template.name}</strong>&nbsp; was deleted".html_safe
    render turbo_stream: [
      turbo_stream.replace('toaster', partial: 'shared/toaster'),
      turbo_stream.update(
        'invitation-template-form',
        partial: 'invitation_templates/template_toolbar',
        locals: { company: @company }
      )
    ]
  end

  private

  def template_params
    params
      .require(:invitation_template)
      .permit(
        :name, :request_subject, :request_body, :company_id, :contribution_page_title, :feedback_page_title,
        { templates_questions_attributes: %i[id invitation_template_id contributor_question_id _destroy] },
        { contributor_questions_attributes: %i[id company_id question] }
      )
  end

  def restore_templates(template_ids)
    factory_defaults = Company.find_by(name: 'CSP').invitation_templates
    template_ids.each do |template_id|
      template = InvitationTemplate.find(template_id)
      default = factory_defaults.find { |t| t.name == template.name }
      template.update(request_subject: default.request_subject, request_body: default.request_body)
      template.contributor_questions.delete_all
      default.contributor_questions.each { |q| template.contributor_questions << q }
    end
  end
end
