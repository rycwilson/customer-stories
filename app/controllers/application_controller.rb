class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  include ApplicationHelper #  really need this? probably shouldn't be calling helper methods in controllers

  # Devise - whitelist User params
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.for(:sign_up) << :first_name
    devise_parameter_sanitizer.for(:account_update) << :first_name
    devise_parameter_sanitizer.for(:sign_up) << :last_name
    devise_parameter_sanitizer.for(:account_update) << :last_name
    devise_parameter_sanitizer.for(:sign_up) << :sign_up_code
  end

  # change devise redirect on sign in
  def after_sign_in_path_for user
    if user.company_id  # returning user
      company_path user.company_id
    # elsif invited_curator = InvitedCurator.find_by(email: user.email)
    #   user.update role: 2, company_id: invited_curator.company_id  # curator
    #   company_path user.company_id
      # TODO: need a callback here to destroy invited_curator
    else
      # user.update role: 1  # company admin
      new_company_path
    end
  end

end
