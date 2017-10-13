
namespace :email do

  desc "send contribution email reminders"
  task send_contribution_reminders: :environment do
    Contribution.send_reminders unless ['Saturday', 'Sunday'].include?(Date::DAYNAMES[Date.today.wday])
  end

  desc "Analytics update"
  task analytics: :environment do
    companies = ['varmour', 'centerforcustomerengagement', 'trunity', 'compas']
    companies.each do |subdomain|
      Company.find_by(subdomain: subdomain)
             .send_analytics_summary
    end
  end

end




