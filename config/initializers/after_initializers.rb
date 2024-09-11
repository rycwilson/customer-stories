Rails.application.config.after_initialize do
  Rails.application.config.assets.precompile -= %w( doorkeeper/application.css doorkeeper/admin/application.css )
end