require 'devise'
require_relative 'controller_macros.rb'

RSpec.configure do |config|
  config.include Devise::Test::IntegrationHelpers, type: :request
  config.include Devise::Test::IntegrationHelpers, type: :feature
  config.include Devise::Test::IntegrationHelpers, type: :system
  # config.extend ControllerMacros, :type => :request
  # config.include Devise::Test::ControllerHelpers, type: :controller
  # config.include Devise::Test::IntegrationHelpers, type: :view
  # config.include Devise::Test::IntegrationHelpers, type: :feature
end