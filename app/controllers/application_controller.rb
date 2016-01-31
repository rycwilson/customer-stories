class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Devise - whitelist User params
  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :validate_subdomain

  protected

  # validate_subdomain ensures that a subdomain attached to any requests is valid,
  #   i.e. is associated with a company
  #
  # TODO: run this once at the beginning of a session, then disallow any
  #  changes to subdomain
  #
  def validate_subdomain
    if Company.any? { |c| c.subdomain == request.subdomain }
      true
    else
      render file: 'public/404', status: 404, layout: false
      false
    end unless (request.subdomain.blank? || request.subdomain == 'www')
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

  # removes the subdomain from the url upon signing out
  def after_sign_out_path_for user
    root_url(host: 'www.' + request.domain)
  end

end
