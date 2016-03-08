class EmailTemplatesController < ApplicationController

  before_action :set_template

  # note: html attributes in the template start as single quote,
  #       after updating they become escaped double quote
  # note: saving template without any changes leads to an empty template body (??)
  def show
    @template.format_for_editor current_user
    respond_to { |format| format.json { render json: @template } }
  end

  def update
    if params[:restore]
      default_template =
        EmailTemplate.where("company_id = ? AND name = ?",
                              Company::CSP.id, @template.name).take
      @template.update(subject: default_template.subject,
                          body: default_template.body)
      @template.format_for_editor current_user
      respond_to do |format|
        format.json { render json: { template: @template,
                            flash: "Template '#{@template.name}' restored to default" } }
      end
    elsif params[:restore_all]
      current_template_name = @template.name
      company = current_user.company
      company.create_email_templates
      current_template =
        EmailTemplate.where("company_id = ? AND name = ?",
                              company.id, current_template_name).take
      templates_select = company.templates_select
      respond_to do |format|
        format.json do
          render json: { current_template: current_template,
                         templates_select: templates_select,
                                    flash: "All templates restored to default" }
        end
      end
    else
      if @template.update( subject: params[:template][:subject],
                              body: params[:template][:body] )
        @flash_mesg = "Changes saved"
        @status = "success"
      else
        @flash_mesg = @template.errors.full_messages.join(', ')
        @status = "danger"
      end
      respond_to { |format| format.js }
    end
  end

  private

  def set_template
    @template = EmailTemplate.find params[:id]
  end

end
