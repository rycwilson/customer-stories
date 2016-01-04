

# desc 'send cron email test'
# task cron_email: :environment do
#   body = "Hello, world!"
#   UserMailer.cron_email(body).deliver_now
# end

namespace :email do
  desc "check age/status of contributions and send email reminders"
  Rails.logger.debug 'email reminder rake task'
  task send_reminders: :environment do
    # Contribution.create
    contributions = Contribution.all
    contributions.each do |contribution|
      Rails.logger.debug contribution.id
    end
    Rails.logger.debug "#{Time.now} - Success!"
  end
end