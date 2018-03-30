class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # before_action { binding.remote_pry }

  # Devise - whitelist User params
  before_action :configure_permitted_parameters, if: :devise_controller?

  before_action(
    :check_subdomain,
    if: Proc.new { user_signed_in? },
    unless: Proc.new { devise_controller? || invalid_subdomain? || params[:controller] == 'widgets' }
  )

  helper_method :company_curator?

  respond_to(:json)

  def auth_test
    respond_to do |format|
      format.json do
        render({
          json: { userEmail: current_user.email, foo: 'bar' },
          status: 200
        })
      end
    end
  end

  protected

  def set_gon company=nil
    is_curator = (user_signed_in? && (current_user.company_id == company.try(:id)))
    gon.push({
      company: company.present? ? JSON.parse(company.to_json({
        methods: [:curators, :customers, :crowdsourcing_templates, :widget],
      })) : nil,
      current_user: user_signed_in? ? {
        id: current_user.id,
        first_name: current_user.first_name,
        last_name: current_user.last_name,
        name: current_user.full_name,
        title: current_user.title,
        email: current_user.email,
        phone: current_user.phone,
        photo: current_user.photo_url,
        is_curator: is_curator
      } : nil,
      stories: company.present? ? company.stories_json : nil,
      env: csp_environment
    })
  end

  def csp_environment
    if ENV['HOST_NAME'] == 'customerstories.net'
      return 'production'
    elsif ENV['HOST_NAME'] == 'customerstories.org'
      return 'staging'
    else
      return 'development'
    end
  end

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
        else # strip the subdomain
          redirect_to url_for({ subdomain: nil,
                                controller: params[:controller],
                                action: params[:action] })
        end
      end
    elsif user_subdomain == request.subdomain  # all good
      true
    elsif request.subdomain.blank? &&
          params[:controller] == 'site' &&
          (['index', 'store_front'].include? params[:action])
      # logged in, navigating to store front
      true
    else  # re-direction required
      if params[:action] == 'linkedin_callback'
         # linkedin_callback won't have subdomain, insert it and include params
        redirect_to url_for({ subdomain: user_subdomain,
                              controller: params[:controller],
                              action: params[:action],
                              params: request.params })
      else
        redirect_to url_for({ subdomain: user_subdomain,
                              controller: params[:controller],
                              action: params[:action] })
      end
    end
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up,
      keys: [:first_name, :last_name, :sign_up_code, :admin_access_code])
    devise_parameter_sanitizer.permit(:account_update) { |user|
      user.permit(:email, :first_name, :last_name, :photo_url, :linkedin_url, :title, :phone, :password, :password_confirmation, :current_password)
    }
  end

  # change devise redirect on sign in
  def after_sign_in_path_for resource
    if session[:user_return_to].present?
      # binding.remote_pry
      session[:user_return_to]
    elsif resource.class.name == 'User'
      # binding.remote_pry
      if resource.company_id.present?  # returning users
        url_for({
            subdomain: resource.company.subdomain,
            controller: '/companies',
            action: 'show',
            id: resource.company.id,
        })
      else
        edit_profile_no_company_path
      end
    elsif resource.class.name == 'Admin'
      rails_admin_path
    end
  end

  # removes the subdomain from the url upon signing out
  def after_sign_out_path_for resource
    url_for({ subdomain: nil, controller: '/site', action: 'index' })
  end

  def invalid_subdomain?
    params[:controller] == 'site' && params[:action] == 'invalid_subdomain'
  end

  def set_s3_direct_post
    @s3_direct_post = S3_BUCKET.presigned_post(key: "uploads/#{SecureRandom.uuid}/${filename}", success_action_status: '201', acl: 'public-read')
  end

  def company_curator? company_id
    user_signed_in? &&
    current_user.company_id == company_id
  end

  # def handle_unverified_request
  #   # binding.remote_pry
  # end

end
