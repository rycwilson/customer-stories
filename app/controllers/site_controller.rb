class SiteController < ApplicationController

  def index
    # if current_user.try :company
    #   redirect_to company_path(current_user.company_id)
    # end
  end

  def valid_subdomain_bad_path
    redirect_to root_url(host: request.host), flash: { warning: "That page doesn't exist" }
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

end
