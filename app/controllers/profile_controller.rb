class ProfileController < ApplicationController

  def linkedin
    if current_user.update linkedin_url: auth_hash[:info][:urls][:public_profile]
      # redirect_to profile_path, flash: { success: 'Connected to LinkedIn!' }
      @linkedin_data = auth_hash
      render :show
    else
      #
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
