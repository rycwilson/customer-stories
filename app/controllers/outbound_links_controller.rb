class OutboundLinksController < ApplicationController
  def create
  end

  def update
    story = Story.find params[:id]
    company = story.success.customer.company
    links = params[:outbound_links]
    if story.outbound_links.blank?
      story.outbound_links << OutboundLink.create(
                                  url: links[:link1_url],
                                  link_text: links[:link1_text],
                                  company_id: company.id)
      story.outbound_links << OutboundLink.create(
                                  url: links[:link2_url],
                                  link_text: links[:link2_text],
                                  company_id: company.id)
    else
      story.outbound_links[0].update(
              url: links[:link1_url],
              link_text: links[:link1_text])
      story.outbound_links[1].update(
              url: links[:link2_url],
              link_text: links[:link2_text])
    end
    respond_to { |format| format.js }
  end

  def destroy
  end
end
