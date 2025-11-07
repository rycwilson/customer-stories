ruby '3.4.3'
source 'https://rubygems.org'

# Server and frameworks
gem 'puma', '~> 6.6'
gem 'rails', '7.2.2.1'

# These are necessary for rails 6 to work with ruby 3.4, can be removed once upgraded to rails 7
# gem 'bigdecimal'
# gem 'mutex_m'
# gem 'reline'
# gem 'irb'

gem 'bootsnap', '~> 1.18', require: false
gem 'rack-cors', '~> 2.0'
gem 'rack_password', '~> 1.3'
gem 'sprockets-rails', '~> 3.5', require: 'sprockets/railtie'
# gem 'rack-timeout', '~> 0.7'
gem 'figaro', '~> 1.2' # needs to be in production group for assets precompilation (which runs in production mode)
gem 'jbuilder', '~> 2.7'
gem 'slim-rails', '~> 3.0'
gem 'stimulus-rails', '~> 1.3'
gem 'turbo-rails', '~> 2.0'

# Database and caching
gem 'faker', '~> 3.2'
gem 'pg', '~> 1.4'
# gem 'connection_pool'
# gem 'dalli'

# Assets
gem 'cssbundling-rails', '~> 1.4'
gem 'jsbundling-rails', '~> 1.1'

# Authentication
gem 'devise', '~> 4.9'
gem 'devise-doorkeeper', '~> 1.2'
gem 'doorkeeper', '~> 5.6'
gem 'pretender', '~> 0.4'
# gem 'oauth2'

# Admin
# gem 'rails_admin', '~> 2.0'

# Services
gem 'aws-sdk-s3', '~> 1.0'
gem 'aws-sdk-ses', '~> 1.6'
# gem 'aws-sdk-rails', '~> 3.0'
gem 'google-ads-googleads', '~> 34.0'

# Utilities
# gem 'activerecord-import'
gem 'friendly_id', '~> 5.4'
# gem 'googlecharts'
gem 'html_to_plain_text', '~> 1.0'
gem 'order_as_specified', '~> 1.0'
gem 'reverse_markdown', '~> 2.0'
# gem 'typhoeus'

# No longer used
# gem 'browser-timezone-rails'
# gem 'local_time'
# gem 'multi_json'

group :development, :test do
  gem 'amazing_print', '~> 2.0'
  gem 'capybara', '~> 3.37'
  gem 'factory_bot_rails', '~> 6.2'
  gem 'pry-byebug', '~> 3.9'
  gem 'pry-rails', '~> 0.3'
  gem 'pry-remote'
  gem 'rspec-rails', '~> 6.0'
  gem 'selenium-webdriver', '~> 4.1'
  # gem 'shoulda-matchers', '~> 5.0'
  # gem 'pry-theme'
end

# all gems provided by default in rails 6
group :development do
  gem 'better_errors'
  gem 'binding_of_caller' # needed for better_errors advanced features
  gem 'rubocop', '~> 1.77', require: false
  gem 'ruby-lsp'
  gem 'spring', '>= 3.0'
  gem 'web-console'
  # gem 'rack-mini-profiler', '~> 2.0'
end
