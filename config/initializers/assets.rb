# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
Rails.application.config.assets.paths << Rails.root.join('node_modules')

# ref: https://stackoverflow.com/questions/10905905/using-fonts-with-rails-asset-pipeline
# Rails.application.config.assets.precompile << /\.(?:svg|eot|woff|ttf|otf)\z/
Rails.application.config.assets.precompile << ['*.svg', '*.eot', '*.woff', '*.woff2', '*.ttf', '*.otf']

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
Rails.application.config.assets.precompile += %w( 
  plugins/cs_overlays.js 
)