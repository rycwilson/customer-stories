module CoreExtensions
  module String
    def remove_dev_ip
      puts "\nremove dev ip\n"
      Rails.env.development? ?
        self.sub(/\.?\d+\.\d+\.\d+\.\d+/, '') :
        self
    end

    # this method might be called on either of: request.domain ('xip.io') or company.subdomain ('acme')
    def add_dev_ip(ip_address)
      puts "\nadd dev ip\n"
      if Rails.env.development?
        if self.match('xip.io')   # domain
          self.sub('xip.io', '127.0.0.1.xip.io')
        else      
          # subdomain may be blank (i.e. sign out)
          self + "#{self.blank? ? '' : '.' }#{ip_address}"     
        end
      end
    end
  end
end