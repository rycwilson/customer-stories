class ProfileController < ApplicationController

  SWITCH_USERS = [
    'Dan acme-test',
    'Dan Lindblom',
    'Dan Demo',
    'Ryan Wilson',
    'Ryan Palo',
    'Bill Lee',
    'Carlos Ramon',
    'Kevin Turner',
    'Haley Fraser',
    'Rachelle Benson'
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
      @switch_users = SWITCH_USERS.flat_map do |name|
        User.where.not(company_id: nil)
          .where(first_name: name.split(' ').first, last_name: name.split(' ').last)
          .map { |user| { id: user.id, email: user.email, name: "#{user.full_name} (#{user.company.name})" }}
      end
    end
  end 

  def update
  end

  def destroy
  end

end
