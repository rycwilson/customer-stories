# openssl and base64 needed for generating smtp credentials
require 'openssl'
require 'base64'

namespace :aws do

  desc 'Generate SMTP credentials'
  task generate_smtp_credentials: :environment do
    key = ENV['AWS_SECRET_ACCESS_KEY']
    region = 'us-west-1'
    date = '11111111'
    service = 'ses'
    terminal = 'aws4_request'
    message = 'SendRawEmail'
    version = "\x04"

    def hmac_sha256(key, data)
      OpenSSL::HMAC.digest('sha256', key, data)
    end

    k_date = hmac_sha256('AWS4' + key, date)
    k_region = hmac_sha256(k_date, region)
    k_service = hmac_sha256(k_region, service)
    k_terminal = hmac_sha256(k_service, terminal)
    k_message = hmac_sha256(k_terminal, message)
    signature_and_version = version + k_message
    smtp_password = Base64.encode64(signature_and_version).strip

    puts 'SMTP password: ' + smtp_password
  end

end