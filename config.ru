# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment', __FILE__)
run Rails.application

# from heroku docs:
# To take advantage of real-time logging, you might need to disable any log buffering your application
# is performing. For example, in Ruby, add this to your config.ru file:
# $stdout.sync = true
