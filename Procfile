
web: bundle exec puma -C config/puma.rb
ssl: bundle exec puma -b "ssl://127.0.0.1:3000?key=$DEV_SSL_KEY_PATH&cert=$DEV_SSL_CERT_PATH" -C config/puma.rb
worker: bundle exec rake jobs:work