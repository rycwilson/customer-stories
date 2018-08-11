# Load the Rails application.
require_relative 'application'

# Initialize the Rails application.
Rails.application.initialize!

# Logger
Rails.logger = Logger.new(STDOUT)
