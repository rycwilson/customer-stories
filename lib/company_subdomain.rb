class CompanySubdomain

  def self.matches? (request)
    request.subdomain.remove_dev_ip.present? && 
    (request.subdomain.remove_dev_ip != 'www') && 
    Company.any? do |company| 
      # ip address will be present in dev environment
      company.subdomain == request.subdomain.remove_dev_ip
    end
  end

end