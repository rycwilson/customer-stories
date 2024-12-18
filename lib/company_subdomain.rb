class CompanySubdomain
  def self.matches? request
    request.subdomain.present? && Company.exists? { |company| company.subdomain == request.subdomain }
  end
end