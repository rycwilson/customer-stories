
# if Rails.env.development? || ENV['HOST_NAME'] == 'customerstories.org'
#   Rack::Timeout.service_timeout = false
# else
#   Rack::Timeout.service_timeout = 15

# this was added with first attempt at rails 5.2 upgrade => supersedes previous?
# => rack-timeout auto-bundled?
if !(Rails.env.development? || ENV['HOST_NAME'] == 'customerstories.org')
  Rails.application.config.middleware.insert_before Rack::Runtime, Rack::Timeout, service_timeout: 15
end

