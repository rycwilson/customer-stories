# frozen_string_literal: true

class Users::PasswordsController < Devise::PasswordsController
  layout('landing')

  # GET /send-password-reset
  def new
    if request.subdomain.present? or request.path == new_user_password_path
      redirect_to(new_csp_user_password_url(subdomain: nil), status: :moved_permanently)
      return
    end
    super
  end

  # POST /send-password-reset
  def create
    super
  end

  # GET /reset-password?reset_password_token=abcdef
  def edit
    if request.path == edit_user_password_path
      redirect_to(edit_csp_user_password_path(reset_password_token: params[:reset_password_token]), status: :moved_permanently)
      return
    end
    super
  end

  # PUT /resource/password
  def update
    super
  end

  protected

  def after_resetting_password_path_for(resource)
    # super(resource)
    edit_csp_user_registration_url(subdomain: resource.company&.subdomain)
  end

  # The path used after sending reset password instructions
  # def after_sending_reset_password_instructions_path_for(resource_name)
  #   super(resource_name)
  # end
end
