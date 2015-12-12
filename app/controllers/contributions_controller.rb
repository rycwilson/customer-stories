class ContributionsController < ApplicationController

  def index
  end

  def new
  end

  def show
  end

  def edit
  end

  def create
    @story = Story.find params[:id]
    @user = User.create(first_name: params[:contributor][:first_name],
                         last_name: params[:contributor][:last_name],
                             email: params[:contributor][:email],
                          # password is necessary, so just set it to the email
                          password: params[:contributor][:email],
                      sign_up_code: 'csp_beta')
    Contribution.create(user_id: @user.id,
                     success_id: @story.success.id,
                           role: params[:contributor][:role],
                         status: 'pre-request')
    # respond with all pre-request contributions, most recent additions first
    @contributors = pre_request_contributors @story.success.contributions
    respond_to do |format|
      format.js
    end
  end

  def destroy
  end

  private

  # this method extracts the necessary combination of contribution
  # and contributor data for new contributor AJAX response
  def pre_request_contributors success_contributions
    success_contributions.order(created_at: :desc)
      .select { |contribution| contribution.status == 'pre-request' }
      .map do |contribution|
        {
          contribution_id: contribution.id,
          user_name: contribution.user.first_name + " " + contribution.user.last_name,
          user_email: contribution.user.email,
          role: contribution.role,
        }
      end
  end

end
