class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Devise - whitelist User params
  before_action :configure_permitted_parameters, if: :devise_controller?

  before_action :check_subdomain,
                  if: Proc.new { user_signed_in? },
              unless: Proc.new { devise_controller? || invalid_subdomain? }

  protected

  #  this method ensures signed in users can't jump to a subdomain they don't belong to
  def check_subdomain
    user_subdomain = current_user.company.try(:subdomain)
    if user_subdomain.nil?
      # user without a company may proceed so long as he doesn't insert
      # a legit subdomain that isn't his ...
      request.subdomain.blank? ? true : redirect_to(File.join(root_url(host: request.domain), request.path))
    elsif user_subdomain == request.subdomain  # all good
      true
    else  # wrong subdomain, re-direct
      redirect_to File.join(root_url(host: user_subdomain + '.' + request.domain), request.path)
    end
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.for(:sign_up) << :first_name
    devise_parameter_sanitizer.for(:account_update) << :first_name
    devise_parameter_sanitizer.for(:sign_up) << :last_name
    devise_parameter_sanitizer.for(:account_update) << :last_name
    devise_parameter_sanitizer.for(:sign_up) << :sign_up_code
    devise_parameter_sanitizer.for(:account_update) << :photo_url
    devise_parameter_sanitizer.for(:account_update) << :linkedin_url
    devise_parameter_sanitizer.for(:account_update) << :title
    devise_parameter_sanitizer.for(:account_update) << :phone
    devise_parameter_sanitizer.for(:account_update) << :subdomain
  end

  # change devise redirect on sign in
  def after_sign_in_path_for user
    if user.company_id.present?  # returning users
      root = root_url(host: user.company.subdomain + '.' + request.domain)
      File.join(root, company_path(user.company_id))
    else
      edit_profile_no_company_path('edit')
    end
  end

  # removes the subdomain from the url upon signing out
  def after_sign_out_path_for user
    root_url(host: request.domain)
  end

  def invalid_subdomain?
    params[:controller] == 'site' && params[:action] == 'invalid_subdomain'
  end

end
