class ProfileController < ApplicationController

  SWITCH_USERS = [
    'dan@customerstories.net', 
    'dlindblo@gmail.com', 
    'demo@customerstories.net',
    'acme-test@customerstories.net',
    'ryanbpalo@customerstories.com',
    'rycwilson@gmail.com', 
    'heather@trunity.com', 
    'haley@pixleeteam.com',
    'awad@pixleeteam.com',
    'colin@pixleeteam.com',
    'bill@c4ce.com',
    'carlos@compas.global',
    'kturner@varmour.com',
    'alex.salai@retailnext.net'
  ]

  def switch
    session[:original_user_id] ||= current_user.id
    impersonate_user(User.find(params[:switch_user_id]))

    # originally this was a sync response, but the subsequent post was missing its hidden param (switch_user_id)
    # => don't know why, but the async approach works well...
    respond_to { |format| format.js }
  end

  def edit
    @user = current_user
    @company = @user.company
    @original_user = User.find_by_id(session[:original_user_id])
    @is_admin = current_user.admin? || @original_user&.admin?
    set_s3_direct_post()
    if @is_admin
      @switch_users = User.where(email: SWITCH_USERS).map do |user|
        { 
          id: user.id, 
          email: user.email,
          name: "#{user.full_name}" + (user.company.present? ? "\s(#{user.company.name})" : '') 
        }
      end
    end
  end 

  def update
  end

  def destroy
  end

end
