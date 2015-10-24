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
# Use CoffeeScript for .coffee assets and views
gem 'coffee-rails', '~> 4.1.0'

gem 'bower-rails'
gem 'devise'
gem 'omniauth'
gem 'omniauth-linkedin'
gem "paperclip", "~> 4.3"
gem 'ffaker'


group :production do

  gem 'rails_12factor'

  # Use Capistrano for deployment
  # gem 'capistrano-rails', group: :development

end

group :development, :test do

  gem 'pry-rails'
  gem 'better_errors'
  gem 'figaro'
  gem 'rspec-rails'
  gem 'capybara-rails'

  # Access an IRB console on exception pages or by using <%= console %> in views
  gem 'web-console', '~> 2.0'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'

end

