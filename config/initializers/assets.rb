# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( search.js )

# ref: https://stackoverflow.com/questions/10905905/using-fonts-with-rails-asset-pipeline
Rails.application.config.assets.precompile << /\.(?:svg|eot|woff|ttf|otf)\z/

# fontawesome included for the google preview window
Rails.application.config.assets.precompile += %w(
  google/ads_preview.js
  google/ads_preview.css
  jquery-textfill/source/jquery.textfill.js
  plugins/cs_video.js
  plugins/cs_overlays.js
  plugins/demo.js
  views/plugins/demo.css
  pdf.css
  mvpready-landing.css
  mvpready-admin.css
)

%w(
  acme-test
  centerforcustomerengagement
  compas
  coupa
  demo
  pixlee
  retailnext
  trunity
  varmour
).each do |subdomain|
  Rails.application.config.assets.precompile += [
    "custom/#{subdomain}/#{subdomain}.css",
    "custom/#{subdomain}/plugins/cs_gallery.css",
    "custom/#{subdomain}/plugins/cs_carousel.css",
    "custom/#{subdomain}/plugins/cs_tabbed_carousel.css"
  ]
end