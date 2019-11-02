# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
#
# by using a custom/wrappers directory, we can include a single entry here
# and avoid unwanted partial sass file precompilation
# (even partial files within this search path will be precompiled => don't want that)
Rails.application.config.assets.paths += %w(
  app/assets/stylesheets/custom/wrappers
  app/assets/stylesheets/custom/plugin_wrappers
)

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
  custom/plugin_wrappers/acme-test_carousel.css
  custom/plugin_wrappers/acme-test_gallery.css
  custom/plugin_wrappers/acme-test_tabbed_carousel.css
  custom/wrappers/centerforcustomerengagement.css
  custom/plugin_wrappers/centerforcustomerengagement_carousel.css
  custom/plugin_wrappers/centerforcustomerengagement_gallery.css
  custom/plugin_wrappers/centerforcustomerengagement_tabbed_carousel.css
  custom/wrappers/compas.css
  custom/plugin_wrappers/compas_carousel.css
  custom/plugin_wrappers/compas_gallery.css
  custom/plugin_wrappers/compas_tabbed_carousel.css
  custom/plugin_wrappers/coupa_carousel.css
  custom/plugin_wrappers/coupa_gallery.css
  custom/plugin_wrappers/coupa_tabbed_carousel.css
  custom/plugin_wrappers/demo_carousel.css
  custom/plugin_wrappers/demo_gallery.css
  custom/plugin_wrappers/demo_tabbed_carousel.css
  custom/wrappers/pixlee.css
  custom/plugin_wrappers/pixlee_carousel.css
  custom/plugin_wrappers/pixlee_gallery.css
  custom/plugin_wrappers/pixlee_tabbed_carousel.css
  custom/plugin_wrappers/retailnext_carousel.css
  custom/plugin_wrappers/retailnext_gallery.css
  custom/plugin_wrappers/retailnext_tabbed_carousel.css
  custom/wrappers/trunity.css
  custom/plugin_wrappers/trunity_carousel.css
  custom/plugin_wrappers/trunity_gallery.css
  custom/plugin_wrappers/trunity_tabbed_carousel.css
  custom/wrappers/varmour.css
  custom/plugin_wrappers/varmour_carousel.css
  custom/plugin_wrappers/varmour_gallery.css
  custom/plugin_wrappers/varmour_tabbed_carousel.css
  pdf.css
  mvpready-landing.css
)
