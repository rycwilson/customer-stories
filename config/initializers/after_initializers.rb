Rails.application.config.after_initialize do
  Rails.application.config.assets.precompile -= %w( 
    doorkeeper/application.css 
    doorkeeper/admin/application.css 
    turbo.js
    turbo.min.js
    turbo.min.js.map
    stimulus.js
    stimulus.min.js
    stimulus.min.js.map
  )
end