class DeviseMailerPreview < ActionMailer::Preview
  # Preview this email at http://localhost:3000/rails/mailers/devise_mailer/confirmation_instructions
  def confirmation_instructions
    user = User.find_by_email 'ryan@ryanwilson.dev'
    Devise::Mailer.confirmation_instructions(user, user.confirmation_token)
  end
end