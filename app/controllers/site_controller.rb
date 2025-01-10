class SiteController < ApplicationController
  skip_before_action :verify_authenticity_token, only: :esp_notifications

  def not_found
    if current_user&.company.present?
      redirect_to root_url(subdomain: current_user.company.subdomain)
    else
      redirect_to(user_signed_in? ? new_company_url(subdomain: '') : root_url(subdomain: ''))
    end
  end

  def landing
    @storefront_page = params[:page] || 'home'
    @feature_partials = %w(crowdsource curate showcase search retarget target_crm target_lookalike measure integrate)
    @feature_names = %w(Crowdsource\ Automation Curate\ Control SEO\ Optimization CRM\ Integration Corporate\ Subdomain Website\ Integration Reporting\ and\ Analytics Media\ Retargeting CRM\ Database\ Retargeting Lookalike\ Targeting High\ Volume\ Targeting Custom\ Billing)
    render(action: @storefront_page.gsub('-', '_'), layout: 'landing')
  end

  def sitemap
    @published_companies = Company.joins(successes: { story: {} })
                                  .where(stories: { published: true })
                                  .where.not("subdomain IN ('csp', 'acme-test')")
                                  .uniq
                                  .map do |company|
                                    { id: company.id,
                                      subdomain: company.subdomain }
                                  end
    @published_companies.each do |published_company|
      published_company[:stories] =
                        Story.joins(success: { customer: { company: {} }})
                             .where(published: true,
                                    companies: { id: published_company[:id] })
                             .map do |story|
                               { url: story.csp_story_url,
                                 last_modified: story.updated_at }
                             end
    end
    respond_to do |format|
      format.xml { render layout: false }
    end
  end

  def google_verify
    render params[:google], layout: false
  end

  def esp_notifications
    # contribution_id was tagged onto the email via X-SMTPAPI header
    #   (requests and reminders only, hence check for contribution below)
    # TODO: why do incoming params include both params[:_json] and params[:site][:_json]?
    contribution = Contribution.find_by id: params[:_json][0][:contribution_id]
    if contribution
      case params[:_json][0][:event]
      when 'open'
        contribution.update(request_received_at: Time.now)
      when 'click'
        # how to keep track of a clicked on but unsubmitted contribution form?
        # eg params[:_json][:url] = http://cisco.lvh.me:3000/contributions/1262f1939a25c209949bd183e630ca79/contribution
      else
      end
    end
    # response required or sendgrid will continue sending
    head :ok
  end
end
