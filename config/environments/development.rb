Rails.application.configure do

  # config.force_ssl = true
  # config.ssl_options = { redirect: { port: 3000 }, hsts: { subdomains: true } }
  config.log_level = :debug

  # carryover from 4.2
  # this ensures subdomans work properly in dev environment (was originally in session_store.rb)
  # ref http://stackoverflow.com/questions/10402777
  config.session_store(
    :cookie_store, key: '_csp_session', domain: 'lvh.me', tld_length: 2
  )

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable/disable caching. By default caching is disabled.
  if Rails.root.join('tmp/caching-dev.txt').exist?  # run rails
    config.action_controller.perform_caching = true
    config.public_file_server.headers = {
      'Cache-Control' => 'public, max-age=172800'
    }
    # config.cache_store = :memory_store  # default
    config.cache_store = :mem_cache_store

    # Rails 4:
    # config.static_cache_control = "public, max-age=172800"
    # config.cache_store = dalli_store,
    #                      'localhost:11211',
    #                      {
    #                         :failover => true,
    #                         :socket_timeout => 1.5,
    #                         :socket_failure_delay => 0.2,
    #                         :down_retry_delay => 60,
    #                         :pool_size => 5  # server threads/concurrency
    #                      }
  else
    config.action_controller.perform_caching = false
    config.cache_store = :null_store
  end

  # Don't care if the mailer can't send.
  # config.action_mailer.raise_delivery_errors = false

  # by default, emails won't send in development environment
  # change this:
  config.action_mailer.perform_deliveries = true
  config.action_mailer.perform_caching = false
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.default_url_options = { host: ENV['HOST_NAME'] }
  ActionMailer::Base.smtp_settings = {
    :address        => 'smtp.sendgrid.net',
    :port           => '587',
    :authentication => :plain,
    :user_name      => ENV['SENDGRID_USERNAME'],
    :password       => ENV['SENDGRID_PASSWORD'],
    :enable_starttls_auto => true
  }

  # sassc-rails
  # ref: https://stackoverflow.com/questions/23180867
  config.sass.inline_source_maps = true
  # config.sass.debug_info = true
  # config.sass.line_comments = false

  # allow render on local network
  # (localtunnel)
  config.web_console.whitelisted_ips = ['73.15.227.206']

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = false

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  # config.file_watcher = ActiveSupport::EventedFileUpdateChecker
end
