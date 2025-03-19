# http://stackoverflow.com/questions/6234045/how-do-you-access-devise-controllers

class Users::RegistrationsController < Devise::RegistrationsController
  layout('landing', only: [:new, :create])
  layout('application', only: [:edit, :update])
  before_action(:configure_sign_up_params, only: [:create])
  before_action(:configure_account_update_params, only: [:update])

  # GET /create-account
  def new
    if request.subdomain.present? or request.path == new_user_registration_path
      flash.keep
      redirect_to(new_csp_user_registration_url(subdomain: nil), status: :moved_permanently)
      return
    end
    super
  end

  # POST /create-account
  def create
    super
  end

  # GET /user-profile
  def edit
    # if a request is received at the default devise route, redirect to the custom route
    if request.path == edit_user_registration_path
      flash.keep
      redirect_to(edit_csp_user_registration_path, status: :moved_permanently)
      return 
    end
    # render(layout: 'application')
  end
  
  # PATCH /user-profile
  # devise should work with turbo since v4.9: 
  # https://discuss.hotwired.dev/t/forms-without-redirect/1606/22
  # https://github.com/heartcombo/devise/blob/v4.9.0/CHANGELOG.md#490---2023-02-17
  def update
    if account_update_params[:password].blank?
      super
    else
      self.resource = resource_class.to_adapter.get!(send(:"current_#{resource_name}").to_key)
      prev_unconfirmed_email = resource.unconfirmed_email if resource.respond_to?(:unconfirmed_email)
      resource_updated = update_resource(resource, account_update_params)
      yield resource if block_given?
      if resource_updated
        # set_flash_message_for_update(resource, prev_unconfirmed_email)
        flash[:notice] = 'Password changed successfully'
        bypass_sign_in resource, scope: resource_name if sign_in_after_change_password?
        respond_with resource, location: after_update_path_for(resource)
      else
        @errors = resource.errors.full_messages   # must be set before the response
        clean_up_passwords resource
        set_minimum_password_length
        respond_with resource
      end
    end
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

  # user, @user, resource are all the same thing
  def update_resource resource, params
    resource.send(params[:password].present? ? :update_with_password : :update_without_password, params)
  end

  def after_update_path_for resource
    edit_csp_user_registration_path
  end

  
  # The path used after sign up.
  def after_sign_up_path_for resource
    # a page to direct them to check their email
    new_company_path
  end
  
  # The path used after sign up for inactive accounts.
  # def after_inactive_sign_up_path_for(resource)
  #   super(resource)
  # end
  
  private
  
  def configure_sign_up_params
    devise_parameter_sanitizer.permit(:sign_up, keys: [:first_name, :last_name, :sign_up_code, :admin_access_code])
  end
  
  def configure_account_update_params
    devise_parameter_sanitizer.permit(:account_update, keys: [:email, :first_name, :last_name, :photo_url, :title, :phone, :password, :password_confirmation, :current_password])
  end
end
