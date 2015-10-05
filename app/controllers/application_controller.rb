class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Devise - whitelist User params
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.for(:sign_up) << :first_name
    devise_parameter_sanitizer.for(:account_update) << :first_name
    devise_parameter_sanitizer.for(:sign_up) << :last_name
    devise_parameter_sanitizer.for(:account_update) << :last_name
    # TODO: not sure if company_id really necessary here
    # not present when signing up (but may be in future versions)
    # User will likely need to create new account if change companies
    devise_parameter_sanitizer.for(:sign_up) << :company_id
    devise_parameter_sanitizer.for(:account_update) << :company_id
  end

  # change devise redirect on sign in
  def after_sign_in_path_for(user)
    return company_path(user.company_id) if user.company_id
    new_company_path
  end

end
