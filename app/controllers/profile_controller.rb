class ProfileController < ApplicationController

  SWITCH_USERS = [
    '***REMOVED***', 
    '***REMOVED***', 
    'demo@customerstories.net',
    'acme-test@customerstories.net',
    'ryanbpalo@customerstories.com',
    '***REMOVED***', 
    'heather@trunity.com', 
    'haley@pixleeteam.com',
    'bill@c4ce.com',
    'colin@pixleeteam.com',
    'carlos@compas.global',
    'awad@pixleeteam.com',
    'kturner@varmour.com'
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
    set_s3_direct_post()
    if current_user.admin? || @original_user.try(:admin?)
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
