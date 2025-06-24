class SiteController < ApplicationController
  # skip_before_action :verify_authenticity_token, only: :esp_notifications

  def landing
    @storefront_page = params[:page] || 'home'
    @feature_partials = %w[crowdsource curate showcase search retarget target_crm target_lookalike measure integrate]
    render(action: @storefront_page.gsub('-', '_'), layout: 'landing')
  end

  def sitemap
    @published_companies = Company.distinct
                                  .joins(:stories)
                                  .where(stories: { published: true })
                                  .where.not("subdomain IN ('csp', 'acme-test')")
                                  .map { |company| { id: company.id, subdomain: company.subdomain } }
    @published_companies.each do |company|
      company[:stories] =
        company.stories.published.map { |story| { url: story.csp_story_url, last_modified: story.updated_at } }
    end
    respond_to { |format| format.xml { render layout: false } }
  end

  def not_found
    if current_user&.company.present?
      redirect_to root_url(subdomain: current_user.company.subdomain)
    elsif user_signed_in?
      redirect_to new_company_url(subdomain: '')
    else
      @company = Company.find_by_subdomain request.subdomain
      render '404_not_found', layout: false
    end
  end

  def google_verify
    render params[:google], layout: false
  end

  # def esp_notifications
  #   # contribution_id was tagged onto the email via X-SMTPAPI header
  #   #   (requests and reminders only, hence check for contribution below)
  #   # TODO: why do incoming params include both params[:_json] and params[:site][:_json]?
  #   contribution = Contribution.find_by id: params[:_json][0][:contribution_id]
  #   if contribution
  #     case params[:_json][0][:event]
  #     when 'open'
  #       contribution.update(request_received_at: Time.now)
  #     when 'click'
  #       # how to keep track of a clicked on but unsubmitted contribution form?
  #       # eg params[:_json][:url] = http://cisco.lvh.me:3000/contributions/1262f1939a25c209949bd183e630ca79/contribution
  #     end
  #   end
  #   # response required or sendgrid will continue sending
  #   head :ok
  # end
end
