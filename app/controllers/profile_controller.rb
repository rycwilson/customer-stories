class ProfileController < ApplicationController

  before_action :set_s3_direct_post, only: :linkedin_callback

  def linkedin_callback
    if user_signed_in?  # company admin or curator
      if current_user.update linkedin_url: auth_hash[:info][:urls][:public_profile]
        # TODO: log the auth_hash
        flash[:info] = 'Connected to LinkedIn!'
        if current_user.company_id.nil?
          redirect_to new_company_path
        else
          redirect_to company_path(current_user.company_id)
        end
      else
        # flash.now[:danger] = "Problem updating linkedin_url field for #{}"
      end
    else # contributor
      contribution = Contribution.find(request.env["omniauth.params"]["contribution"])
      if contribution.user.update linkedin_url: auth_hash[:info][:urls][:public_profile]
        redirect_to confirm_contribution_path(request.env["omniauth.params"]["contribution"], linkedin: true)
      else
        # flash.now[:danger] = "Problem updating linkedin_url field for #{}"
      end
    end
  end

  def show
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

  private

  def set_s3_direct_post
    @s3_direct_post = S3_BUCKET.presigned_post(key: "uploads/#{SecureRandom.uuid}/${filename}", success_action_status: '201', acl: 'public-read')
  end

end
