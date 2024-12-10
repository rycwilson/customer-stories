# openssl and base64 needed for generating smtp credentials
require 'openssl'
require 'base64'

namespace :aws do

  desc 'Generate SMTP credentials'
  task generate_smtp_credentials: :environment do
    message = "SendRawEmail"
    version = "\x02"
    signature = OpenSSL::HMAC.digest('sha256', ENV['AWS_SECRET_ACCESS_KEY'], message)
    smtp_password = Base64.encode64(version + signature).strip
    puts 'SMTP password: ' + smtp_password
  end

end