class UserMailer < ApplicationMailer
      default from: 'noreply@customerstories.net'
 
  def cron_email()
 
    mail(to: '***REMOVED***', subject: 'testing cron emailer')
  end
    
end
