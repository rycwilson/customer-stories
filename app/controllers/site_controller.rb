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

end
