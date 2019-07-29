

# TODO configure webpack-dev-server
if Rails.env.development?
  Rails.application.config.content_security_policy do |policy|
    policy.connect_src(
      :self, 
      :https, 
      'http://localhost:3035', 
      'ws://localhost:3035'
    )
  end
end