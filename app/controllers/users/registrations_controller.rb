# http://stackoverflow.com/questions/6234045/how-do-you-access-devise-controllers

class Users::RegistrationsController < Devise::RegistrationsController
  IMITABLE_USERS = [
    'Dan acme-test',
    'Dan Lindblom',
    'Dan Demo',
    'Ryan Wilson',
    'Ryan Palo',
    'Bill Lee',
    'Carlos Ramon',
    'Kevin Turner',
    'Heather Annesley',
    'Haley Fraser',
    'Rachelle Benson'
  ]
# before_filter :configure_sign_up_params, only: [:create]
# before_action :configure_account_update_params, only: [:update]
# before_action :set_s3_direct_post, only: [:edit, :update]

  layout('landing')
  respond_to :html, :js

  before_action(only: [:new]) { set_preserved_form_data }

  # GET /resource/sign_up
  def new
    super
  end

  # POST /resource
  def create
    # super
    build_resource(sign_up_params)

    resource.save
    yield resource if block_given?
    if resource.persisted?
      if resource.active_for_authentication?
        set_flash_message! :notice, :signed_up
        sign_up(resource_name, resource)
        respond_with resource, location: after_sign_up_path_for(resource)
      else
        set_flash_message! :notice, :"signed_up_but_#{resource.inactive_message}"
        expire_data_after_sign_in!
        respond_with resource, location: after_inactive_sign_up_path_for(resource)
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      # respond_with resource
      session[:sign_up_email] = resource.email
      session[:sign_up_first_name] = resource.first_name
      session[:sign_up_last_name] = resource.last_name
      redirect_back(
        fallback_location: { action: 'new' }, 
        flash: {
          alert: resource.errors.full_messages.map do |mesg|
            case mesg
            when 'Sign up code is not included in the list'
              'Invalid sign up code'
            else
              mesg
            end
          end
        }
      )
    end
  end

  # GET /user-profile
  def edit
    # if a request is received at the default devise route, redirect to the custom route
    redirect_to(edit_user_path) && return if request.path == edit_user_registration_path

    # original_user = User.find_by_id(session[:original_user_id])
    # @is_admin = current_user.admin? || original_user&.admin?
    @is_admin = current_user.admin? || true_user.admin?
    if @is_admin
      @imitable_users = IMITABLE_USERS.flat_map do |name|
        User
          .where.not(company_id: nil)
          .where(first_name: name.split(' ').first, last_name: name.split(' ').last)
          # .map { |user| { id: user.id, email: user.email, name: "#{user.full_name} (#{user.company.name})" } }
      end
    end

    render(:edit, layout: 'application')
  end

  # PUT /resource
  # overriding native devise in order to customize flash message
  def update
    if params[:user][:photo_url]
      @s3_direct_post_fields = set_s3_direct_post().fields
    end
    super
    # self.resource = resource_class.to_adapter.get!(send(:"current_#{resource_name}").to_key)
    # prev_unconfirmed_email = resource.unconfirmed_email if resource.respond_to?(:unconfirmed_email)

    # resource_updated = update_resource(resource, account_update_params)
    # yield resource if block_given?
    # if resource_updated
    #   if is_flashing_format?
    #     if update_needs_confirmation?(resource, prev_unconfirmed_email)
    #       set_flash_message :notice, :update_needs_confirmation
    #     else
    #       flash[:notice] = 'Account updated'
    #     end
    #   end
    #   sign_in resource_name, resource, bypass: true
    #   respond_with resource, location: after_update_path_for(resource)
    # else
    #   clean_up_passwords resource
    #   respond_with resource
    # end
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
  # user, @user, resource are all the same thing (weird)
  def update_resource user, params
    # @linkedin_url_changed = (params[:linkedin_url] != @user.linkedin_url) ? true : false
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
  def after_sign_up_path_for user
    # a page to direct them to check their email
    new_company_path
  end

  # The path used after sign up for inactive accounts.
  # def after_inactive_sign_up_path_for(resource)
  #   super(resource)
  # end

  private

  def set_preserved_form_data
    @sign_up_email = session[:sign_up_email]
    @sign_up_first_name = session[:sign_up_first_name]
    @sign_up_last_name = session[:sign_up_last_name]
    session.delete(:sign_up_email)
    session.delete(:sign_up_first_name)
    session.delete(:sign_up_last_name)
  end
end
