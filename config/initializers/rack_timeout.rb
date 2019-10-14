
unless Rails.env.development? || ENV['HOST_NAME'] == 'customerstories.org'
  Rails.application.config.middleware.insert_before Rack::Runtime, Rack::Timeout, service_timeout: 15
end