# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path
# Add Yarn node_modules folder to the asset load path.
Rails.application.config.assets.paths << Rails.root.join('node_modules')

# ref: https://stackoverflow.com/questions/10905905/using-fonts-with-rails-asset-pipeline
# Rails.application.config.assets.precompile << /\.(?:svg|eot|woff|ttf|otf)\z/
Rails.application.config.assets.precompile << ['*.svg', '*.eot', '*.woff', '*.woff2', '*.ttf', '*.otf']

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( admin.js admin.css )
Rails.application.config.assets.precompile += %w(
  mvpready-landing.css
  google/ads_preview.js
  google/ads_preview.css
  jquery-textfill/source/jquery.textfill.js
  plugins/cs_overlays.js
)

# custom stylesheets
Dir.glob("#{Rails.root.join('app', 'assets', 'stylesheets', 'custom')}/**/*.css") do |file_path|
  company_subdomain = file_path.match(/custom\/(?<subd>[a-z0-9-]+)\//)['subd']
  Rails.application.config.assets.precompile << "custom/#{company_subdomain}/#{File.basename(file_path)}"
end