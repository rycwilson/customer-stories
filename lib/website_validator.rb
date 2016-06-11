class WebsiteValidator < ActiveModel::EachValidator

  def url_exist? url_string
    url = URI.parse url_string
    req = Net::HTTP.new url.host, url.port
    req.use_ssl = (url.scheme == 'https')
    path = url.path if url.path.present?
    res = req.request_head(path || '/')
    if res.kind_of? Net::HTTPRedirection
      url_exist? res['location'] # Go after any redirect and make sure you can access the redirected URL
    else
      # http://neonova.net failed validation with a 4xx message
      # so, let 4xx and 5xx pass through (at least means the site is there) ...
      true
      # ! %W(4 5).include?(res.code[0]) # Not from 4xx or 5xx families
    end
  rescue Errno::ENOENT, SocketError, Errno::ECONNREFUSED, Net::OpenTimeout, OpenSSL::SSL::SSLError
    false
  end

  def validate_each record, attribute, value
    if value == 'http://'
      record.errors[attribute] << "is required"
      return
    end
    unless url_exist? value
      record.errors[attribute] << "does not appear to be a valid web address (or the server may be down)"
    end
  end

end