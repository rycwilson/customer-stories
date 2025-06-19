require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Csp
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 6.1
    
    # Following are settings that override 6.1 defaults in order to preserve current app behavior
    config.action_view.form_with_generates_ids = true
    
    # Configuration for the application, engines, and railties goes here.
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    # config.time_zone = "Central Time (US & Canada)"

    config.middleware.use Rack::Deflater

    # rack-cors
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*'
        resource '*', headers: :any, methods: [:get, :post, :options]
      end
    end

    # custom fonts
    # ref https://gist.github.com/anotheruiguy/7379570
    config.assets.paths << Rails.root.join('app', 'assets', 'fonts')

    # Precompile Bootstrap fonts
    # config.assets.precompile << %r(bootstrap-sass/assets/fonts/bootstrap/[\w-]+\.(?:eot|svg|ttf|woff2?)$)

    # Route constraints such as DeviseSubdomain and CompanySubdomain require this:
    config.eager_load_paths << Rails.root.join('lib')

  end
end
