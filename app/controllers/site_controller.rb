class SiteController < ApplicationController

  def index
  end

  def strip_subdomain
    if request.query_string.present?
      redirect_to request.protocol + request.domain + request.path + '?' + request.query_string
    else
      redirect_to request.protocol + request.domain + request.path
    end
  end

  def valid_subdomain_bad_path
    redirect_to root_url(host: request.host), flash: { warning: "Page doesn't exist" }
  end

  def invalid_subdomain
    redirect_to root_url(host: request.domain)
  end

  def store_front
    case request.path
    when /\/(product)(.html)?/
      render :product
    when /\/(plans)(.html)?/
      render :plans
    when /\/(our-company)(.html)?/
      render :our_company
    when /\/(team)(.html)?/
      render :team
    when /\/(tos)(.html)?/
      render :tos
    when /\/(privacy)(.html)?/
      render :privacy
    when /\/(our-story)(.html)?/
      render :our_story
    else
      redirect_to root_path
    end
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

end
