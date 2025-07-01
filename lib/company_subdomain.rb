# frozen_string_literal: true

class CompanySubdomain
  def self.matches?(request)
    request.subdomain.present? and Company.exists?(subdomain: request.subdomain)
  end
end
