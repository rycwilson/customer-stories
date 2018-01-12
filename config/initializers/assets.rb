# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( search.js )

Rails.application.config.assets.precompile += %w(
  custom/compas.css
  stories/show/social-share.css
  adwords/ads_preview.js
  jquery-textfill/source/jquery.textfill.js
  adwords/ads_preview.css
  widget/cs-widget-tab.css
  widget/cs-widget-rel.css
  widget/cs-widget-rel-exp.css
  widget/cs-widget-varmour.css
  pdf.css
  mvpready-landing.css
  mvpready-admin.css
)