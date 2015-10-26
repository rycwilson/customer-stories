# Load the Rails application.
require File.expand_path('../application', __FILE__)

# Initialize the Rails application.
Rails.application.initialize!

# Setup sendgrid mail
ActionMailer::Base.smtp_settings = {
  :address        => 'smtp.sendgrid.net',
  :port           => '587',
  :authentication => :plain,
  :user_name      => ENV['app42836101@heroku.com'],
  :password       => ENV['***REMOVED***'],
  :domain         => 'heroku.com',
  :enable_starttls_auto => true
}