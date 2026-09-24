# frozen_string_literal: true

class CompanySubdomain
  def self.matches?(request)
    # TODO: Save { subdomain => company_id } to Redis
    # memory_store = {}
    # company_exists = memory_store[request.subdomain] || Company.exists?(subdomain: request.subdomain)
    request.subdomain.present? and Company.exists?(subdomain: request.subdomain)
  end
end
