class ContributorQuestionsController < ApplicationController
  before_action(:set_company)

  def create
    if @company.update company_params
      respond_to do |format|
        format.turbo_stream do
          flash.now[:notice] = 'Contributor Prompt created successfully'
          render turbo_stream: shared_turbo_stream_actions, status: :created
        end
      end
    else
      @errors = @company.errors
    end
  end
  
  def update
    if @company.update company_params
      respond_to do |format|
        format.turbo_stream do
          flash.now[:notice] = 'Contributor Prompt has been updated'
          render turbo_stream: shared_turbo_stream_actions
        end
      end
    else
      @errors = @company.errors
    end
  end

  def destroy
    if ContributorQuestion.find(params[:id])&.destroy
      respond_to do |format|
        format.turbo_stream do
          flash.now[:info] = 'Contributor Prompt was deleted'
          render turbo_stream: shared_turbo_stream_actions
        end
      end
    else
      # error
    end
  end

  private

  def company_params
    params
      .require(:company)
      .permit(
        contributor_questions_attributes: [:id, :question, :_destroy]
      )
  end

  def shared_turbo_stream_actions
    [
      turbo_stream.replace('toaster', partial: 'shared/toaster'),
      turbo_stream.update(
        'contributor-prompts-frame',
        partial: 'companies/contributor_prompts',
        locals: { company: @company }
      )
    ]
  end
end