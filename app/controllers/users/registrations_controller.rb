# http://stackoverflow.com/questions/6234045/how-do-you-access-devise-controllers

class Users::RegistrationsController < Devise::RegistrationsController
# before_filter :configure_sign_up_params, only: [:create]
# before_action :configure_account_update_params, only: [:update]
# before_action :set_s3_direct_post, only: [:edit, :update]

  respond_to :html, :js

  # GET /resource/sign_up
  def new
    super
  end

  # POST /resource
  def create
    super
  end

  # GET /resource/edit
  def edit
    super
  end

  # PUT /resource
  def update
    super
  end

  # DELETE /resource
  def destroy
    super
  end

  # GET /resource/cancel
  # Forces the session data which is usually expired after sign
  # in to be expired now. This is useful if the user wants to
  # cancel oauth signing in/up in the middle of the process,
  # removing all OAuth session data.
  def cancel
    super
  end

  protected

  # override the update action
  def update_resource user, params
    if params[:password].blank?
      resource.update_without_password params
      @password_update = false
    else
      resource.update params
      @password_update = true
    end
    if @user.errors.present?
      @flash_mesg = @user.errors.full_messages.join(', ')
      @status = 'danger'
    else
      @status = 'success'
    end
  end

  # change redirect on update
  def after_update_path_for user
    edit_profile_path
  end

  # If you have extra params to permit, append them to the sanitizer.
  # def configure_sign_up_params
  #   devise_parameter_sanitizer.for(:sign_up) << :attribute
  # end

  # If you have extra params to permit, append them to the sanitizer.
  # def configure_account_update_params
  #   devise_parameter_sanitizer.for(:account_update) << :attribute
  # end

  # The path used after sign up.
  # TODO: If user must confirm via email, what's the point of this?
  # def after_sign_up_path_for(resource)
  #   # a page to direct them to check their email
  # end

  # The path used after sign up for inactive accounts.
  # def after_inactive_sign_up_path_for(resource)
  #   super(resource)
  # end

  private

end
