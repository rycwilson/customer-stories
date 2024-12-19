class CompanySubdomain
  def self.matches? request
    request.subdomain.present? && Company.exists?(subdomain: request.subdomain)
  end
end