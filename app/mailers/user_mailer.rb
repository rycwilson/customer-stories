class UserMailer < ApplicationMailer
      default from: 'noreply@customerstories.net'

  def cron_email()

    mail(to: '***REMOVED***', subject: 'testing cron emailer')
  end

  def contribution_invite email

    mail(to: email, subject: 'Tell us about your success')

  end

end
