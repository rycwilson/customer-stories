# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( search.js )

Rails.application.config.assets.precompile += %w(
  site.js site.css
  users/sessions.js users/sessions.css
  users/registrations.js users/registrations.css
  users/passwords.js  users/passwords.css
  users/confirmations.js users/confirmations.css
  companies.js companies.css
  stories.js stories.css
  profile.js profile.css
  contributions.js contributions.css
  devise/sessions.css
  devise/registrations.css
  devise/confirmations.css
  devise/passwords.css
  widget.css
)