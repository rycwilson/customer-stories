class AuthSubdomain

  def self.matches? (request)
    request.subdomain == 'auth'
  end

end