class EmailTemplatesController < ApplicationController

  before_action :set_template

  def show
    respond_to { |format| format.json { render json: @template } }
  end

  def update
    if @template.update( subject: params[:template][:subject],
                            body: params[:template][:body] )
      flash.now[:success] = "Changes saved"
      respond_to { |format| format.js { render action: 'update_success' } }
    else
      flash.now[:danger] = "Can't save changes: #{@template.errors.full_messages.join(', ')}"
      respond_to { |format| format.js { render action: 'update_error' } }
    end
  end

  private

  def set_template
    @template = EmailTemplate.find params[:id]
  end

end
