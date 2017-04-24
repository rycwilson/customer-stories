
if Rails.env.development?
  Rack::Timeout.service_timeout = false
else
  Rack::Timeout.service_timeout = 20
end

