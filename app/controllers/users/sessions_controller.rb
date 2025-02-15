# http://stackoverflow.com/questions/6234045/how-do-you-access-devise-controllers

class Users::SessionsController < Devise::SessionsController
  # before_filter :configure_sign_in_params, only: [:create]
  layout('landing')

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

    # super
    self.resource = resource_class.new(sign_in_params)
    clean_up_passwords(resource)
    yield resource if block_given?
    if flash.alert == I18n.t('devise.failure.unauthenticated')
      flash[:info] = flash.alert
      flash.delete(:alert)
    end
    respond_with(resource, serialize_options(resource))
  end

  # POST /resource/sign_in
  def create
    # user will be authenticated by warden before this action is reached:
    # https://github.com/heartcombo/devise/issues/4951
    # https://github.com/heartcombo/devise/issues/5602
    if unauthorized_subdomain?
      @not_authorized_for_subdomain = true
      sign_out_and_redirect(current_user)
      flash.alert = 'Not authorized'
      return
    end
    super
    flash.delete(:notice)
  end

  # DELETE /resource/sign_out
  def destroy
    super
    flash.delete(:notice)
  end

  def impersonate
    # redirect_to(edit_user_path) and return unless true_user.admin?
    # if not true_user.admin?
    #   redirect_to(edit_user_path)
    #   return
    # end
    if true_user.admin? and imitable_user = User.find_by_id(params[:imitable_user_id])
      impersonate_user(imitable_user)
      session['authorized_subdomains'] = ['', imitable_user.company.subdomain]
      # TODO both redirects result in a 401 - why?
      # redirect_to edit_user_url(subdomain: current_user.company.subdomain)
      # redirect_to url_for(subdomain: current_user.company.subdomain, controller: 'users/registrations', action: 'edit')
      respond_to do |format|
        format.js { render js: "window.location.replace('#{edit_user_url(subdomain: current_user.company.subdomain)}')" }
      end
    else
      redirect_to(edit_user_path)
    end
  end

  # protected

  # If you have extra params to permit, append them to the sanitizer.
  # def configure_sign_in_params
  #   devise_parameter_sanitizer.for(:sign_in) << :attribute
  # end

  # private
end
