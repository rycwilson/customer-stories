
class SuccessesController < ApplicationController

  before_action(except: [:index, :create]) { @success = Success.find(params[:id]) }

  def index
    company = Company.find_by(subdomain: request.subdomain)
    # data = Rails.cache.fetch("#{company.subdomain}/dt-successes") do
    data = company.successes.to_json({
        only: [:id, :name, :description], methods: [:display_status],
        include: {
          curator: { only: [:id], methods: [:full_name] },
          customer: { only: [:id, :name] },
          story: { only: [:id, :title] }
        }
      })
    # end
    respond_to { |format| format.json { render({ json: data }) } }
  end

  def create
    # binding.remote_pry
    pp success_params
    @success = Success.new(success_params)

    if @success.save
    else
      pp @success.errors.full_messages
    end

    respond_to { |format| format.js {} }
  end

  def update
  end

  def destroy
  end

  private

  def success_params
    params.require(:success).permit(:name, :description, :customer_id, :curator_id,
      customer_attributes: [:id, :name, :company_id],
      contributions_attributes: [
        :user_id, :referrer_id,
        contributor_attributes: [
          :id, :first_name, :last_name, :email, :sign_up_code, :password
        ]
      ],
    )
  end

end