class ProfileController < ApplicationController

  before_action { @user = current_user; @company = @user.try(:company) }
    # note company may be nil (contributor on site, or contrbution submission)
  before_action only: [:edit] { set_gon(@company) }
  before_action :set_s3_direct_post, only: [:edit]

  def edit
  end

  def update
  end

  def destroy
  end

end
