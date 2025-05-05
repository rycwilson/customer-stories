ruby '3.1.2'
source 'https://rubygems.org'

# Server and frameworks
gem 'puma', '~> 5.0'
gem 'rails', '~> 6.0'
gem 'bootsnap', '>= 1.4.4', require: false
gem 'rack-cors'
gem 'rack_password'
gem 'rack-timeout', require: "rack/timeout/base"
gem 'figaro'
gem 'turbo-rails', '~> 2.0'
gem 'stimulus-rails', '~> 1.2'
gem 'slim-rails', '~> 3.0'
gem 'jbuilder', '~> 2.7'

# Database and caching
gem 'pg'
# gem 'connection_pool'
# gem 'dalli'

# Assets
gem 'jsbundling-rails'
gem 'bootstrap-sass', '3.3.6'
gem 'sassc-rails', '>= 2.1.0'
gem 'font-awesome-rails'
# gem 'sprockets', '~> 4.0'

# Authentication
gem 'devise'
gem 'doorkeeper'
gem 'devise-doorkeeper'
gem 'pretender'
# gem 'oauth2'

# Admin
gem 'rails_admin', '~> 2.0'

# Services 
gem 'aws-sdk-ses', '~> 1.6'
gem 'aws-sdk-s3', '~> 1.0'
# gem 'aws-sdk-rails', '~> 3.0'
# gem 'google-adwords-api', '1.5'

# Utilities
gem 'activerecord-import'
gem 'awesome_print'
gem 'friendly_id'
gem 'googlecharts'
gem 'html_to_plain_text'
gem 'order_as_specified'
gem 'pry-rails' 
gem 'pry-remote'
gem 'pry-theme'
gem 'reverse_markdown'
gem 'typhoeus'

# Patches / Fixes 
# https://stackoverflow.com/questions/70500220
gem 'net-smtp', require: false    
gem 'net-imap', require: false
gem 'net-pop', require: false

# (devise dependency) https://stackoverflow.com/questions/79360526/uninitialized-constant-activesupportloggerthreadsafelevellogger-nameerror
gem 'concurrent-ruby', '1.3.4' 

# Previously used, currently unused
# gem 'browser-timezone-rails'
# gem 'local_time'
# gem 'multi_json'

group :development, :test do
  gem 'rspec-rails', '~> 6.0'
  gem 'shoulda-matchers', '~> 5.0'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'capybara' 
  gem 'selenium-webdriver', '~> 4.1'
  gem 'pry-byebug'
  gem 'better_errors'
  gem 'binding_of_caller'   # needed for better_errors features
end

# all gems provided by default in rails 6
group :development do
  gem 'web-console', '>= 4.1.0'
  gem 'spring'
  gem 'solargraph'

  # Can be configured to work on production as well, see: 
  # https://github.com/MiniProfiler/rack-mini-profiler/blob/master/README.md
  # gem 'rack-mini-profiler', '~> 2.0'
  gem 'listen', '~> 3.3'
end
