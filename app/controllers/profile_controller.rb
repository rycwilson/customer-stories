class ProfileController < ApplicationController

  def linkedin
    if user_signed_in?
      if current_user.update linkedin_url: auth_hash[:info][:urls][:public_profile]
        @linkedin_data = auth_hash
        flash.now[:info] = 'Connected to LinkedIn!'
        render :show
      else
        # flash.now[:danger] = "Problem updating linkedin_url field for #{}"
      end
    else # request came from contributor submission (not loggged in)
      contribution = Contribution.find(request.env["omniauth.params"]["contribution"])
      if contribution.user.update linkedin_url: auth_hash[:info][:urls][:public_profile]
        redirect_to confirm_contribution_path(request.env["omniauth.params"]["contribution"], linkedin: true)
      else
        # flash.now[:danger] = "Problem updating linkedin_url field for #{}"
      end
    end
  end

  def show
    # LinkedIn data will display if this is the first render upon
    # authentication, else message will appear
    @linkedin_data ||= { message: "this data is not persisted" };
  end

  def edit
  end

  def update
  end

  def destroy
  end

  protected

  def auth_hash
    request.env['omniauth.auth']
  end

end
