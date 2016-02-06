class Subdomain

  def self.matches? request
    request.subdomain.present? && (request.subdomain != "www") && Company.any? { |c| c.subdomain == request.subdomain }
  end

end