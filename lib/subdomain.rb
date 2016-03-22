class Subdomain

  def self.matches? request
    request.subdomain.present? && (request.subdomain !=~ /(www|csp-staging|floating-spire-2927)/) && Company.any? { |c| c.subdomain == request.subdomain }
  end

end