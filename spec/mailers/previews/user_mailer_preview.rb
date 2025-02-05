class UserMailerPreview < ActionMailer::Preview
  def send_mail
    UserMailer.send_mail
  end
end