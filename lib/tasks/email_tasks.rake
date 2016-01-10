
namespace :email do
  desc "send contribution email reminders"
  task send_contribution_reminders: :environment do
    puts "processing contribution #{contribution.id} with status #{contribution.status}"
    Contribution.send_reminders
    puts "status for #{contribution.id} is now #{contribution.status}"
  end
end

