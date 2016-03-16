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
      if request.subdomain.blank?
        true
      else
        # ok to access public pages (story, stories index, or contributions)
        if (params[:controller] == 'stories' && (['index', 'show'].include? params[:action])) ||
            params[:controller] == 'contributions'
          true
        else
          redirect_to(File.join(root_url(host: request.domain), request.path))
        end
      end
    elsif user_subdomain == request.subdomain  # all good
      true
    elsif request.subdomain.blank? &&
          params[:controller] == 'site' &&
          (['index', 'store_front'].include? params[:action])
      # logged in, navigating to store front
      true
    else  # wrong subdomain, re-direct
      redirect_to File.join(root_url(host: user_subdomain + '.' + request.domain), request.path)
    end
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.for(:sign_up) << :first_name
    # devise_parameter_sanitizer.for(:account_update) << :first_name
    devise_parameter_sanitizer.for(:sign_up) << :last_name
    # devise_parameter_sanitizer.for(:account_update) << :last_name
    devise_parameter_sanitizer.for(:sign_up) << :sign_up_code
    devise_parameter_sanitizer.for(:sign_up) << :admin_access_code

    devise_parameter_sanitizer.for(:account_update) { |u|
      u.permit(:email, :first_name, :last_name, :photo_url, :linked_url, :title, :phone, :password, :password_confirmation, :current_password)
    }

  end

  # change devise redirect on sign in
  def after_sign_in_path_for resource
    if resource.class.name == 'User'
      if resource.company_id.present?  # returning users
        root = root_url(host: resource.company.subdomain + '.' + request.domain)
        File.join(root, company_path(resource.company_id))
      else
        edit_profile_no_company_path
      end
    elsif resource.class.name == 'Admin'
      rails_admin_path
    end
  end

  # removes the subdomain from the url upon signing out
  def after_sign_out_path_for user
    root_url(host: request.domain)
  end

  def invalid_subdomain?
    params[:controller] == 'site' && params[:action] == 'invalid_subdomain'
  end

  def set_s3_direct_post
    @s3_direct_post = S3_BUCKET.presigned_post(key: "uploads/#{SecureRandom.uuid}/${filename}", success_action_status: '201', acl: 'public-read')
  end

end
