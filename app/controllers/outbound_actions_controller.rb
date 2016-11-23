class OutboundActionsController < ApplicationController

  def create
    story = Story.find params[:id]
    company = story.success.customer.company
    if params[:outbound_action][:link_url].present?
      story.outbound_actions <<
        OutboundLink.create(link_url: params[:outbound_action][:link_url],
                            link_display_text: params[:outbound_action][:link_display_text],
                            company_id: company.id)
    else
      binding.remote_pry
      story.outbound_actions <<
        OutboundScript.create(html: params[:outbound_action][:html],
                              html_display_text: params[:outbound_action][:html_display_text],
                              company_id: company.id)

    end
    # if story.outbound_actions.blank?
    #   story.outbound_links << OutboundLink.create(
    #                               url: links[:link1_url],
    #                               link_text: links[:link1_text],
    #                               company_id: company.id)
    #   story.outbound_links << OutboundLink.create(
    #                               url: links[:link2_url],
    #                               link_text: links[:link2_text],
    #                               company_id: company.id)
    # else
    #   story.outbound_links[0].update(
    #           url: links[:link1_url],
    #           link_text: links[:link1_text])
    #   story.outbound_links[1].update(
    #           url: links[:link2_url],
    #           link_text: links[:link2_text])
    # end
    respond_to { |format| format.js }
  end

  def update
  end

  def destroy
  end

end
