class DevSubdomain

  def self.matches? (request)
    request.subdomain.remove_dev_ip == 'cspdev'
  end

end