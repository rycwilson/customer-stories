# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment', __FILE__)
run Rails.application

# this tells heroku to log puts statements
# ref https://stackoverflow.com/questions/22261624
$stdout.sync = true
