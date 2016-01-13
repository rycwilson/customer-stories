
namespace :email do
  desc "send contribution email reminders"
  task send_contribution_reminders: :environment do
    Contribution.send_reminders unless ['Saturday', 'Sunday'].include?(Date::DAYNAMES[Date.today.wday])
  end
end

