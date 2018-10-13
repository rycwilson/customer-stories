
ruby '2.5.0'
source 'https://rubygems.org'

# NOTE: Front-end assets are all managed through the bower-rails gem
#  see Bowerfile
#  run rake bower:install to install assets listed in Bowerfile

gem 'activerecord-import'
gem 'aws-sdk', '~> 2'
gem 'awesome_print'
gem 'bootstrap-tab-history-rails'
gem 'bower-rails', '~> 0.11.0'
gem 'browser-timezone-rails'
gem 'connection_pool'
gem 'dalli'
# gem 'delayed_job_active_record'
gem 'devise'
gem 'devise-doorkeeper'
gem 'doorkeeper'
gem 'ffaker'
gem 'figaro'
gem 'font-awesome-rails'
gem 'friendly_id', '~> 5.1.0'
gem 'gon'
gem 'googlecharts'
gem 'google-adwords-api', '1.4.0'
gem 'html_to_plain_text'
# gem 'jazz_hands', github: 'nixme/jazz_hands', branch: 'bring-your-own-debugger'
gem 'jquery-minicolors-rails'
gem 'local_time'
# gem 'miro'
gem 'multi_json'
# gem 'oauth2'
gem 'order_as_specified'
gem 'pg'
# gem 'pry'
# gem 'pry-byebug'  # causes issues with pry-remote
gem 'pry-rails'
gem 'pry-remote'
# gem 'pry-rescue'
gem 'pry-theme'
gem 'rails', '5.2.1'
# gem 'rails', '4.2.1' # Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails_admin'
gem 'rails-html-sanitizer'
gem 'rack_password'
# gem 'rack-timeout'
gem 'reverse_markdown'
# gem 'sass-rails', '~> 5.0'
gem 'sassc-rails'
gem 'summernote-rails'
gem 'switch_user'
gem 'turbolinks', '~> 5.0.0'
gem 'typhoeus'
gem 'uglifier', '>= 1.3.0'
gem 'wicked_pdf'
gem 'wkhtmltopdf-binary'

group :production do

  gem 'puma'
  gem 'rails_12factor'
  gem 'rack-timeout'

end

group :development, :test do

  # gem 'rack-mini-profiler'
  # gem 'flamegraph'
  # gem 'stackprof'
  # gem 'whenever', require: false
  gem 'better_errors'
  # Access an IRB console on exception pages or by using <%= console %> in views

  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'web-console', '~> 3.0'
  gem 'binding_of_caller'

end