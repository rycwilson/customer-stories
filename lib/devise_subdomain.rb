class DeviseSubdomain
  def self.matches? request
    CompanySubdomain.matches?(request) or request.subdomain.blank?
  end
end