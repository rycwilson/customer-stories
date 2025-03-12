class Users::ConfirmationsController < Devise::ConfirmationsController
  layout('landing')
  
  # GET /resend-confirmation 
   def new
    if request.subdomain.present? or request.path == new_user_confirmation_path
      redirect_to(resend_user_confirmation_url(subdomain: nil), status: :moved_permanently)
      return
    end
    super
   end

  # POST /resend-confirmation
   def create
     super
   end

  # GET /resource/confirmation?confirmation_token=abcdef
   def show
     super
   end

  protected

  # The path used after resending confirmation instructions.
  # def after_resending_confirmation_instructions_path_for(resource_name)
  #   super(resource_name)
  # end

  # The path used after confirmation.
  def after_confirmation_path_for(resource_name, resource)
    # super(resource_name, resource)
    sign_in(resource)
    edit_csp_user_registration_url(subdomain: resource.company&.subdomain)
  end
end
