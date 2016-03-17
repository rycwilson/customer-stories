class SiteController < ApplicationController

  def index
  end

  def strip_www_subdomain
    logger.debug "PASSWORD REQUEST INFO: #{request.original_url}"
    redir = request.protocol + request.domain + request.path + '?' + request.query_string
    logger.debug "REDIRECTING TO: #{redir}"
    redirect_to redir
  end

  def valid_subdomain_bad_path
    redirect_to root_url(host: request.host), flash: { warning: "That page doesn't exist" }
  end

  def invalid_subdomain
    # logger.debug "PASSWORD REQUEST INFO: #{request.original_url}"
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
