require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Csp
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # config.assets.paths << Rails.root.join('vendor', 'assets' 'node_modules')
    
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

    # TODO how does this apply to yarn?
    # per https://github.com/twbs/bootstrap-sass/blob/master/README.md
    # root.join('vendor', 'assets', 'bower_components').to_s.tap do |bower_path|
    #   config.sass.load_paths << bower_path
    #   config.assets.paths << bower_path
    # end
    # # Precompile Bootstrap fonts
    # config.assets.precompile << %r(bootstrap-sass/assets/fonts/bootstrap/[\w-]+\.(?:eot|svg|ttf|woff2?)$)
    # # Minimum Sass number precision required by bootstrap-sass
    # ::Sass::Script::Value::Number.precision = [8, ::Sass::Script::Value::Number.precision].max
    ###

    # load custom classes
    config.autoload_paths += Dir["#{config.root}/lib/**/"]

    # config.active_job.queue_adapter = :delayed_job
  end
end
