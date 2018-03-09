class DevSubdomain

  def self.matches? (request)
    request.subdomain == 'cspdev'
  end

end