class ProfileController < ApplicationController

  before_action { @user = current_user; @company = @user.try(:company) }
  before_action :set_s3_direct_post, only: [:edit]

  def edit
  end

  def update
  end

  def destroy
  end

end
