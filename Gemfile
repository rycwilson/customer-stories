ruby '3.1.2'
source 'https://rubygems.org'

# Server and frameworks
gem 'puma', '~> 6.6'
gem 'rails', '6.1.7.10'
gem 'bootsnap', '~> 1.18', require: false
gem 'rack-cors', '~> 2.0'
gem 'rack_password', '~> 1.3'
gem 'rack-timeout', '~> 0.7'
gem 'figaro', '~> 1.2'    # needs to be in production group for assets precompilation (which runs in production mode)
gem 'turbo-rails', '~> 2.0'
gem 'stimulus-rails', '~> 1.3'
gem 'slim-rails', '~> 3.0'
gem 'jbuilder', '~> 2.7'

# Database and caching
gem 'pg', '~> 1.4'
gem 'faker', '~> 3.2'
# gem 'connection_pool'
# gem 'dalli'

# Assets
gem 'jsbundling-rails', '~> 1.1'
gem 'cssbundling-rails', '~> 1.4'
# gem 'bootstrap-sass', '3.3.6'
# gem 'sassc-rails', '>= 2.1.0'
gem 'font-awesome-rails', '~> 4.7'
# gem 'sprockets', '~> 4.0'

# Authentication
gem 'devise', '~> 4.9'
gem 'doorkeeper', '~> 5.6'
gem 'devise-doorkeeper', '~> 1.2'
gem 'pretender', '~> 0.4'
# gem 'oauth2'

# Admin
# gem 'rails_admin', '~> 2.0'

# Services 
gem 'aws-sdk-ses', '~> 1.6'
gem 'aws-sdk-s3', '~> 1.0'
# gem 'aws-sdk-rails', '~> 3.0'
# gem 'google-adwords-api', '1.5'

# Utilities
# gem 'activerecord-import'
gem 'awesome_print', '~> 1.9'
gem 'friendly_id', '~> 5.4'
# gem 'googlecharts'
gem 'html_to_plain_text', '~> 1.0'
gem 'order_as_specified', '~> 1.0'
gem 'pry-rails', '~> 0.3' 
gem 'pry-remote', '~> 0.1'
# gem 'pry-theme'
gem 'reverse_markdown', '~> 2.0'
# gem 'typhoeus'

# Patches / Fixes 
# https://stackoverflow.com/questions/70500220
gem 'net-smtp', require: false    
gem 'net-imap', require: false
gem 'net-pop', require: false

# (devise dependency) https://stackoverflow.com/questions/79360526/uninitialized-constant-activesupportloggerthreadsafelevellogger-nameerror
gem 'concurrent-ruby', '1.3.4' 

# No longer used
# gem 'browser-timezone-rails'
# gem 'local_time'
# gem 'multi_json'

group :development, :test do
  gem 'rspec-rails', '~> 6.0'
  gem 'shoulda-matchers', '~> 5.0'
  gem 'factory_bot_rails', '~> 6.2'
  gem 'capybara', '~> 3.37' 
  gem 'selenium-webdriver', '~> 4.1'
  gem 'pry-byebug', '~> 3.9'
end

# all gems provided by default in rails 6
group :development do
  gem 'web-console', '~> 4.2'
  gem 'spring', '~> 4.0'
  gem 'solargraph', '~> 0.44'
  gem 'better_errors', '~> 2.9'
  gem 'binding_of_caller', '~> 1.0'   # needed for better_errors advanced features

  # Can be configured to work on production as well, see: 
  # https://github.com/MiniProfiler/rack-mini-profiler/blob/master/README.md
  # gem 'rack-mini-profiler', '~> 2.0'
  gem 'listen', '~> 3.3'
end
