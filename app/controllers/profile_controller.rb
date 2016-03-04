class ProfileController < ApplicationController

  before_action :set_user, only: :edit
  before_action :set_company, only: :edit
  before_action :set_s3_direct_post, only: [:linkedin_callback, :edit]

  def linkedin_callback
    if user_signed_in?  # company admin or curator
      if current_user.update(linkedin_url: auth_hash[:info][:urls][:public_profile],
                                    phone: auth_hash[:info][:phone],
                                    title: auth_hash[:info][:description])
        # TODO: log the auth_hash
        if current_user.company_id.present?
          flash[:success] = 'Account setup complete'
          redirect_to company_path(current_user.company_id)
        else
          flash[:info] = 'Connected to LinkedIn'
          redirect_to edit_profile_no_company_path
        end
      else
        # flash.now[:danger] = "Problem updating linkedin_url field for #{}"
      end
    else # contributor
      contribution = Contribution.find(request.env["omniauth.params"]["contribution"])
      contribution.contributor.update linkedin_url: auth_hash[:info][:urls][:public_profile]
      redirect_to confirm_contribution_path(request.env["omniauth.params"]["contribution"], linkedin_oauth_connect: true)
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

  def set_user
    @user = current_user
  end

  def set_company
    if current_user.company_id.present?
      @company = Company.find current_user.company_id
    else
      true  # return value is insignificant
    end
  end

  def set_s3_direct_post
    @s3_direct_post = S3_BUCKET.presigned_post(key: "uploads/#{SecureRandom.uuid}/${filename}", success_action_status: '201', acl: 'public-read')
  end

end
