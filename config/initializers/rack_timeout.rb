
if Rails.env.development? || ENV['HOST_NAME'] == 'customerstories.org'
  Rack::Timeout.service_timeout = false
else
  Rack::Timeout.service_timeout = 30
end

