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

Rails.application.config.assets.precompile += %w(
  adwords/ads_preview.js
  jquery-textfill/source/jquery.textfill.js
  adwords/ads_preview.css
  widgets/cs_video.js
  widgets/cs_overlays.js
  widgets/demo.js
  views/widgets/demo.css
  custom/acme-test/plugins/cs_gallery.css
  custom/acme-test/plugins/cs_carousel.css
  custom/acme-test/plugins/cs_tabbed_carousel.css
  custom/centerforcustomerengagement/plugins/cs_gallery.css
  custom/centerforcustomerengagement/plugins/cs_carousel.css
  custom/centerforcustomerengagement/plugins/cs_tabbed_carousel.css
  custom/compas/plugins/cs_gallery.css
  custom/compas/plugins/cs_carousel.css
  custom/compas/plugins/cs_tabbed_carousel.css
  custom/demo/plugins/cs_gallery.css
  custom/demo/plugins/cs_carousel.css
  custom/demo/plugins/cs_tabbed_carousel.css
  custom/pixlee/plugins/cs_gallery.css
  custom/pixlee/plugins/cs_carousel.css
  custom/pixlee/plugins/cs_tabbed_carousel.css
  custom/retailnext/plugins/cs_gallery.css
  custom/retailnext/plugins/cs_carousel.css
  custom/retailnext/plugins/cs_tabbed_carousel.css
  custom/trunity/plugins/cs_gallery.css
  custom/trunity/plugins/cs_carousel.css
  custom/trunity/plugins/cs_tabbed_carousel.css
  custom/varmour/plugins/cs_gallery.css
  custom/varmour/plugins/cs_carousel.css
  custom/varmour/plugins/cs_tabbed_carousel.css
  pdf.css
  mvpready-landing.css
  mvpready-admin.css
)
