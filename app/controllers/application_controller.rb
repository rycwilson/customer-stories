class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery(with: :exception)
  add_flash_types(:info, :warning)
  impersonates(:user)
  helper_method(:company_admin_page?)
  
  before_action(unless: :skip_subdomain_authorization?) do 
    if unauthorized_subdomain?
      redirect_to(current_user.company.blank? ? new_company_url(subdomain: '') : public_stories_url(subdomain: current_user.company.subdomain))
    end
  end
  before_action(if: [:company_admin_page?, :impersonating_user?]) { flash.now[:warning] = "Impersonating user: #{current_user.full_name}" }
  before_action(:set_footer_links, if: -> { (controller_name == 'site') || :devise_controller? })

  def auth_test
    respond_to do |format|
      format.any do  # zapier sends GET request with Accept = */* (any format permissable)
        render({
          # content_type: 'application/json',  # not necessary
          json: { user: { email: current_user.email, company_id: current_user.company_id } },
          status: 200
        })
      end
    end
  end

  protected

  def csp_environment
    if ENV['HOST_NAME'] == 'customerstories.net'
      return 'production'
    elsif ENV['HOST_NAME'] == 'ryanwilson.dev'
      return 'staging'
    else
      return 'development'
    end
  end

  def after_sign_in_path_for current_resource
    if session[:user_return_to].present?
      session[:user_return_to]
    elsif current_resource.class.name == 'User'
      if current_resource.company.present?
        dashboard_url('curate', subdomain: current_resource.company.subdomain)
      else
        edit_csp_user_registration_path
      end
    elsif current_resource.class.name == 'Admin'
      rails_admin_path
    end
  end

  def after_sign_out_path_for resource
    if request.subdomain.present?
      if @not_authorized_for_subdomain
        new_csp_user_session_url(subdomain: '')
      else
        public_stories_url(subdomain: request.subdomain)
      end
    else
      new_csp_user_session_url(subdomain: '')
    end
  end

  def set_s3_direct_post
    @s3_direct_post = S3_BUCKET.presigned_post(key: "uploads/#{SecureRandom.uuid}/${filename}", success_action_status: '201')
  end

  def company_curator? company_id
    user_signed_in? &&
    current_user.company_id == company_id
  end

  private

  def skip_subdomain_authorization?
    not user_signed_in? or
    signing_in_or_out? or  # users/sessions#create will handle subdomain authorization independently
    public_page? or
    turbo_frame_request? or
    request.subdomain == DEV_TUNNEL_SUBDOMAIN or
    controller_name == 'plugins' or
    action_name == 'not_found'
  end

  def signing_in_or_out?
    controller_name == 'sessions' and action_name.in? ['create', 'destroy']
  end

  def public_page?
    controller_name == 'stories' and action_name.in? ['index', 'show'] or controller_name == 'contributions'
  end

  def company_admin_page?
    controller_name == 'companies' && action_name.in?(['new', 'show', 'edit']) or
    controller_name == 'registrations' && action_name.in?(['edit', 'update']) or
    controller_name == 'stories' && action_name == 'edit'
  end

  def impersonating_user?
    user_signed_in? and current_user != true_user
  end

  def unauthorized_subdomain?
    session['authorized_subdomains']&.exclude?(request.subdomain)
  end

  def set_footer_links
    @footer_links = %w(terms privacy company our-story).map do |path| 
      [ path, File.join(root_url(subdomain: nil), path) ]
    end.to_h
  end
end
