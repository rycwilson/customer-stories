class OutboundActionsController < ApplicationController

  def show
    @form = OutboundForm.find params[:id]
    render layout: false
  end

  def create
    story = Story.find params[:id]
    company = story.success.customer.company
    action = params[:outbound_action]
    if action[:link_url].present?
      story.outbound_actions <<
          @new_action = OutboundLink.create(
            link_url: action[:link_url], company_id: company.id,
            display_text: action[:link_display_text],
            description: action[:link_description])
    else
      story.outbound_actions <<
          @new_action = OutboundForm.create(
            form_html: action[:form_html],
            display_text: action[:form_display_text], company_id: company.id,
            description: action[:form_description])
    end
    respond_to { |format| format.js }
  end

  def update
  end

  # method responds with the deleted action object's id
  # the id isn't needed by client, however if empty response (e.g. format.json { head :ok }),
  # then response isn't caught by the AJAX success handler
  def destroy
    action = OutboundAction.find params[:id]
    action.destroy
    respond_to { |format| format.json { render json: { action: action.id } } }
  end

end
