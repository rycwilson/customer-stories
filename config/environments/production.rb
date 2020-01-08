Rails.application.configure do

  # restrict access to staging site
  # if ENV['HOST_NAME'] == 'customerstories.org'
  #   config.middleware.use RackPassword::Block,
  #     auth_codes: ['csp-stag!ng'],
  #     path_whitelist: /(widgets|plugins)/,
  #     custom_rule: proc { |request| request.params.keys.include?('is_plugin') }
  # end

  if ENV['HOST_NAME'] == 'customerstories.net'
    config.session_store(:cookie_store, key: '_csp_session', domain: 'customerstories.net', tld_length: 2)
  elsif ENV['HOST_NAME'] == 'customerstories.org'
    config.session_store(:cookie_store, key: '_csp_session', domain: 'customerstories.org', tld_length: 2)
  end

  # Use the lowest log level to ensure availability of diagnostic information
  # when problems arise.
  if ENV['HOST_NAME'] == 'customerstories.net'
    config.log_level = :warn
  else
    config.log_level = :info
  end

  # Code is not reloaded between requests.
  config.cache_classes = true

  # Eager load code on boot. This eager loads most of Rails and
  # your application in memory, allowing both threaded web servers
  # and those relying on copy on write to perform better.
  # Rake tasks automatically ignore this option for performance.
  config.eager_load = true

  # Full error reports are disabled and caching is turned on.
  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true
  config.cache_store = :dalli_store,
                       (ENV["MEMCACHIER_SERVERS"] || "").split(","),
                       {:username => ENV["MEMCACHIER_USERNAME"],
                        :password => ENV["MEMCACHIER_PASSWORD"],
                        :failover => true,
                        :socket_timeout => 1.5,
                        :socket_failure_delay => 0.2,
                        :down_retry_delay => 60,
                        :pool_size => 5  # server threads/concurrency
                       }

  # Disable serving static files from the `/public` folder by default since
  # Apache or NGINX already handles this.
  config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?

  # Compress JavaScripts and CSS.
  config.assets.js_compressor = :uglifier
  # config.assets.css_compressor = :sass

  # Do not fallback to assets pipeline if a precompiled asset is missed.
  config.assets.compile = false

  # `config.assets.precompile` and `config.assets.version` have moved to config/initializers/assets.rb

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.action_controller.asset_host = 'http://assets.example.com'

  # Specifies the header that your server uses for sending files.
  # config.action_dispatch.x_sendfile_header = 'X-Sendfile' # for Apache
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect' # for NGINX

  # Mount Action Cable outside main process or domain
  # config.action_cable.mount_path = nil
  # config.action_cable.url = 'wss://example.com/cable'
  # config.action_cable.allowed_request_origins = [ 'http://example.com', /http:\/\/example.*/ ]

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true

  # Prepend all log lines with the following tags.
  config.log_tags = [ :request_id ]

  # Use a real queuing backend for Active Job (and separate queues per environment)
  # config.active_job.queue_adapter     = :resque
  # config.active_job.queue_name_prefix = "csp_#{Rails.env}"
  config.action_mailer.perform_caching = false

  # Ignore bad email addresses and do not raise email delivery errors.
  # Set this to true and configure the email server for immediate delivery to raise delivery errors.
  # config.action_mailer.raise_delivery_errors = false

  # config sendgrid emails
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.delivery_method = :smtp
  # What exactly does this host setting do?
  #  because it works fine when the actual host name is
  #  something different, e.g. 'floating-spire-2927.herokuapp.com'
  config.action_mailer.default_url_options = { host: ENV['HOST_NAME'] }
  ActionMailer::Base.smtp_settings = {
    :address        => 'smtp.sendgrid.net',
    :port           => '587',
    :authentication => :plain,
    :user_name      => ENV['SENDGRID_USERNAME'],
    :password       => ENV['SENDGRID_PASSWORD'],
    :domain         => ENV['HOST_NAME'],
    :enable_starttls_auto => true
  }

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  
  # TODO for Rails >= 5.2.2, can use this:
  # config.i18n.fallbacks = true
  # else
  config.i18n.fallbacks = [I18n.default_locale]

  # Send deprecation notices to registered listeners.
  config.active_support.deprecation = :notify

  # Use default logging formatter so that PID and timestamp are not suppressed.
  config.log_formatter = ::Logger::Formatter.new

  # Use a different logger for distributed setups.
  # require 'syslog/logger'
  # config.logger = ActiveSupport::TaggedLogging.new(Syslog::Logger.new 'app-name')

  if ENV["RAILS_LOG_TO_STDOUT"].present?
    logger           = ActiveSupport::Logger.new(STDOUT)
    logger.formatter = config.log_formatter
    config.logger = ActiveSupport::TaggedLogging.new(logger)
  end

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false
end
