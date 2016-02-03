class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Devise - whitelist User params
  before_action :configure_permitted_parameters, if: :devise_controller?

  # for all except sign-in and sign-out requests (devise controller)
  before_action :check_subdomain

  protected

  #
  # check_subdomain ensures that a subdomain attached to any request is valid,
  #   i.e. is associated with a company
  #
  # if a user is signed in, any changes to request.subdomain result in redirecting
  #   to user.company.subdomain
  #
  def check_subdomain
    # skip this callback (return true) if the user is signing in,
    #   else a Curator from one Company can log into his own Company through
    #   another Company's subdomain (not insecure, but weird)
    if params[:controller] == 'users/sessions' && params[:action] == 'create'
      return true
    end
    if user_signed_in? && current_user.company.nil?
      return true
    end
    valid_subdomain = Company.any? { |c| c.subdomain == request.subdomain } if request.subdomain.present?
    if user_signed_in? && request.subdomain.present?
      valid_user_subdomain = valid_subdomain && (current_user.company.try(:subdomain) == request.subdomain)
      if !valid_subdomain || !valid_user_subdomain || request.subdomain.blank? # includes www, other companies, or gibberish
        redirect_to File.join(
                root_url(host: current_user.company.try(:subdomain) + '.' + request.domain), request.path )
      else
        true
      end
    elsif user_signed_in? && request.subdomain.blank?
      redirect_to File.join(
                root_url(host: current_user.company.try(:subdomain) + '.' + request.domain), request.path )
    elsif request.subdomain.present? && request.subdomain != 'www'  # user not signed in
      if valid_subdomain
        true  # go to new session page
      else
        redirect_to root_url(host: 'www.' + request.domain)
      end
    end
    true
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
    if user.company_id  # returning users
      root = root_url(host: user.company.subdomain + '.' + request.domain + request.port_string)
      File.join(root, company_path(user.company_id))
    # elsif invited_curator = InvitedCurator.find_by(email: user.email)
      #   user.update role: 2, company_id: invited_curator.company_id  # curator
      #   company_path user.company_id
      # TODO: callback to destroy invited_curator
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
