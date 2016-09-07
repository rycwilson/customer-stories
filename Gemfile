
ruby '2.3.0'

source 'https://rubygems.org'

# NOTE: Front-end assets are all managed through the bower-rails gem
#  see Bowerfile
#  run rake bower:install to install assets listed in Bowerfile

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '4.2.1'
# Use postgresql as the database for Active Record
gem 'pg'
# Use SCSS for stylesheets
gem 'sass-rails', '~> 5.0'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'

# this was supposedly going to help with history api cross-browser
# compatibility, but didn't change onpopstate behavior
# gem 'wiselinks'

gem 'typhoeus'
gem 'switch_user'
gem 'html_to_plain_text'
gem 'wicked_pdf'
gem 'wkhtmltopdf-binary'
gem 'rails-html-sanitizer'
gem 'turbolinks', '~> 5.0.0'
gem 'aws-sdk', '~> 2'
gem 'bower-rails', "~> 0.10.0"
gem 'font-awesome-rails'
gem 'figaro'
gem 'devise'
gem 'omniauth'
gem 'omniauth-linkedin'
gem 'multi_json'
gem "paperclip", "~> 4.3"
gem 'ffaker'
gem 'rails_admin'
gem 'best_in_place', '~> 3.0.1'
gem 'summernote-rails'
gem 'jquery-minicolors-rails'
gem 'friendly_id', '~> 5.1.0'


group :production do

  gem 'puma'
  gem 'rails_12factor'

end

group :development, :test do

  gem 'pry-rails'
  gem 'whenever', require: false
  gem 'better_errors'
  # Access an IRB console on exception pages or by using <%= console %> in views

  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'web-console', '~> 3.0'
  gem 'binding_of_caller'

end