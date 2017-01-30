# Load the Rails application.
require File.expand_path('../application', __FILE__)

# Initialize the Rails application.
Rails.application.initialize!

# Logger
Rails.logger = Logger.new(STDOUT)

# Rails.cache.silence!
