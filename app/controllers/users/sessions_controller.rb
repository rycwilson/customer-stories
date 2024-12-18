# http://stackoverflow.com/questions/6234045/how-do-you-access-devise-controllers

class Users::SessionsController < Devise::SessionsController
  # before_filter :configure_sign_in_params, only: [:create]
  layout('landing')

  # if attempting to log in through a subdomain (in the url, not in the form),
  # validate that request.subdomain matches the user.company.subdomain
  # this callback assumes the user exists.
  before_action(only: :create) do
    if request.subdomain.present? && request.subdomain != DEV_TUNNEL_SUBDOMAIN
      validate_user_subdomain(request.subdomain, params[:user][:email])
    end
  end

  # GET /resource/sign_in
  # a sign_in form submitted as zap auth request will have f.hidden_field(:zap_auth_submitted, value: true)
  # and that param will appear here if a validation error results in re-render
  # Why is this necessary?
  # 1 - Since the form may be rendered repeatedly (validation error), we need to keep track of
  # whether to display the zap auth sign in form or the regular sign in form.
  # 2 - But @zap_auth_initial_req will only be true on the initial connection,
  # after that we need another way to keep track.
  # (see also application.html.erb)
  def new
    # redirect_to(new_user_session_path) and return if request.path =~ /users/
    @zap_auth_initial_req = true if request.referer.try(:include?, 'zapier')
    # @zap_auth_initial_req = true
    @zap_auth_retry = params.dig(:user, :zap_auth_submitted).present?
    super
  end

  # POST /resource/sign_in
  def create
    super
    flash.delete(:notice)
  end

  # DELETE /resource/sign_out
  def destroy
    super
    flash.delete(:notice)
  end

  def impersonate
    redirect_to(edit_user_path) && return unless true_user.admin?
    if imitable_user = User.find_by_id(params[:imitable_user_id])
      impersonate_user(imitable_user)
      @toast = { type: 'success', message: "Impersonating #{imitable_user.full_name}" }
    else
      # @toast = { type: 'danger', message: 'User not found' }
    end
    # this results in a 401 when redirecting to a different subdomain - why?
    # redirect_to edit_user_url(subdomain: current_user.company.subdomain)
    respond_to do |format|
      format.js { render js: 'window.location.reload()' }
    end
  end

  # protected

  # If you have extra params to permit, append them to the sanitizer.
  # def configure_sign_in_params
  #   devise_parameter_sanitizer.for(:sign_in) << :attribute
  # end

  private

  def validate_user_subdomain subdomain, email
    if User.find_by(email: email).try(:company).try(:subdomain) == subdomain
      true
    else
      # kill session since user is already logged in at this point (not sure why!)
      request.reset_session
      redirect_to(root_url(host: request.domain), flash: { danger: "Not authorized" }) and return false
    end
  end

end
