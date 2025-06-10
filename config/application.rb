require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Csp
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration can go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded after loading
    # the framework and any gems in your application.

    # config.load_defaults 5.2

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

    # load custom classes
    # this is from rails4, but autoload behavior changed in rails5: config.autoload_paths += Dir["#{config.root}/lib/**/"]
    config.eager_load_paths << Rails.root.join('lib')

    # config.active_job.queue_adapter = :delayed_job
  end
end
