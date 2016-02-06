class SiteController < ApplicationController

  def index
    if current_user.try :company
      redirect_to company_path(current_user.company_id)
    end
  end

  def valid_subdomain_bad_path
    redirect_to root_url(host: request.host), flash: { warning: "That page doesn't exist" }
  end

  def invalid_subdomain
    redirect_to root_url(host: request.domain)
  end

end
