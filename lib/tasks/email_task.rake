

desc 'send cron email test'
task cron_email: :environment do
  # ... set options if any
  UserMailer.cron_email().deliver!
end