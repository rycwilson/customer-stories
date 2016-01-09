
namespace :email do
  desc "check age/status of contributions and send email reminders"
  task send_contribution_reminders: :environment do
    Contribution.where("status IN ('request', 'remind1')")
                .each do |contribution|
      puts "processing contribution #{contribution.id} with status #{contribution.status}"
      contribution.send_reminder
      puts "status is now #{contribution.status}"
    end
  end
end