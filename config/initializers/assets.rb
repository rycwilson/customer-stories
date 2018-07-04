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
  widgets/story_overlays.js
  custom/trunity/widgets/cs_carousel.css
  custom/trunity/widgets/cs_fixed_carousel.css
  custom/trunity/widgets/cs_gallery.css
  custom/varmour/widgets/cs_carousel.css
  custom/varmour/widgets/cs_fixed_carousel.css
  custom/varmour/widgets/cs_gallery.css
  custom/retailnext/widgets/cs_carousel.css
  custom/retailnext/widgets/cs_fixed_carousel.css
  custom/retailnext/widgets/cs_gallery.css
  custom/compas/widgets/cs_carousel.css
  custom/compas/widgets/cs_fixed_carousel.css
  custom/compas/widgets/cs_gallery.css
  custom/centerforcustomerengagement/widgets/cs_carousel.css
  custom/centerforcustomerengagement/widgets/cs_fixed_carousel.css
  custom/centerforcustomerengagement/widgets/cs_gallery.css
  pdf.css
  mvpready-landing.css
  mvpready-admin.css
)
