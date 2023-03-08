# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path
# Add Yarn node_modules folder to the asset load path.
# TODO Is yarn required in rails6?
# Rails.application.config.assets.paths << Rails.root.join('node_modules')

# by using a custom/wrappers directory, we can include a single entry here
# and avoid unwanted partial sass file precompilation
# (even partial files within this search path will be precompiled => don't want that)
Rails.application.config.assets.paths += %w(
  app/assets/stylesheets/custom/wrappers
  app/assets/stylesheets/custom/plugin_wrappers
)

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( admin.js admin.css )

# ref: https://stackoverflow.com/questions/10905905/using-fonts-with-rails-asset-pipeline
# Rails.application.config.assets.precompile << /\.(?:svg|eot|woff|ttf|otf)\z/
Rails.application.config.assets.precompile << ['*.svg', '*.eot', '*.woff', '*.woff2', '*.ttf', '*.otf']

Rails.application.config.assets.precompile += %w(
  pdf.css
  mvpready-landing.css
  google/ads_preview.js
  google/ads_preview.css
  jquery-textfill/source/jquery.textfill.js
  plugins/cs_video.js
  plugins/cs_overlays.js
  vendor/vendor.js
  stories_main.js
)

# companies with custom styles
Rails.application.config.assets.precompile += %w(
  custom/wrappers/centerforcustomerengagement.css
  custom/wrappers/compas.css
  custom/wrappers/pixlee.css
  custom/wrappers/trunity.css
  custom/wrappers/varmour.css
)

# all companies should appear here for basic plugin styles
Rails.application.config.assets.precompile += %w(
  custom/plugin_wrappers/acme-test_plugins.css
  custom/plugin_wrappers/centerforcustomerengagement_plugins.css
  custom/plugin_wrappers/compas_plugins.css
  custom/plugin_wrappers/compelling-cases_plugins.css
  custom/plugin_wrappers/corefact_plugins.css
  custom/plugin_wrappers/coupa_plugins.css
  custom/plugin_wrappers/demo_plugins.css
  custom/plugin_wrappers/juniper_plugins.css
  custom/plugin_wrappers/kodacon_plugins.css
  custom/plugin_wrappers/modeanalytics_plugins.css
  custom/plugin_wrappers/neonova_plugins.css
  custom/plugin_wrappers/perch_plugins.css
  custom/plugin_wrappers/pixlee_plugins.css
  custom/plugin_wrappers/references_plugins.css
  custom/plugin_wrappers/retailnext_plugins.css
  custom/plugin_wrappers/saucelabs_plugins.css
  custom/plugin_wrappers/smartpaymentplan_plugins.css
  custom/plugin_wrappers/testco_plugins.css
  custom/plugin_wrappers/trunity_plugins.css
  custom/plugin_wrappers/varmour_plugins.css
  custom/plugin_wrappers/zeniq_plugins.css
  custom/plugin_wrappers/zoommarketing_plugins.css
)
