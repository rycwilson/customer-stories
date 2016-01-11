
namespace :email do
  desc "send contribution email reminders"
  task send_contribution_reminders: :environment do
    Contribution.send_reminders
  end
end

