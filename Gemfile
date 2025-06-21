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
gem "sprockets-rails", '~> 3.5', :require => 'sprockets/railtie'
# gem 'rack-timeout', '~> 0.7'
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
gem 'reverse_markdown', '~> 2.0'
# gem 'typhoeus'

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
  gem 'pry-rails', '~> 0.3'
  gem 'pry-remote'
  # gem 'pry-theme'
end

# all gems provided by default in rails 6
group :development do
  gem 'web-console'
  gem 'spring', '>= 3.0'
  gem 'ruby-lsp'
  gem 'rubocop', require: false
  gem 'better_errors'
  gem 'binding_of_caller'   # needed for better_errors advanced features
  # gem 'rack-mini-profiler', '~> 2.0'
end
