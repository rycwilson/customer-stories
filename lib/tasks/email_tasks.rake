
namespace :email do
  desc "check age/status of contributions and send email reminders"
  task send_contribution_reminders: :environment do
    Contribution.where("status IN ('request', 'remind1', 'remind2')")
                .each do |contribution|
      puts "processing contribution #{contribution.id}..."
      if contribution.remind_at.past?
        if contribution.status == 'remind2'
          new_status = 'did_not_respond'
          puts "#{contribution.status} is now #{new_status}"
          contribution.update(status: new_status, remind_at: nil) # no more reminders
        else
          UserMailer.contribution_reminder(contribution).deliver_now
          new_status = (contribution.status == 'request') ? 'remind1' : 'remind2'
          puts "#{contribution.status} is now #{new_status}"
          contribution.update(
                      status: new_status,
                   # update remind_at relative to its current value instead of Time.now
                   # -> consistent email times
                   remind_at: contribution.remind_at + contribution.reminder_frequency.days )
        end
      end
    end
  end
end