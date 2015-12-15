class ApplicationMailer < ActionMailer::Base

  # include ApplicationHelper
  helper :application

  default from: "from@example.com"
  layout 'mailer'

end
