
class SuccessesController < ApplicationController

  before_action(except: [:index, :create]) { @success = Success.find(params[:id]) }

  def index
    company = Company.find_by(subdomain: request.subdomain)
    # data = Rails.cache.fetch("#{company.subdomain}/dt-successes") do
    data = company.successes.to_json({
        only: [:id, :name, :description], methods: [:display_status, :contributions_count],
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
    @success = Success.create(success_params)
    # if @success.save
    # else
    # end
    respond_to() { format.js() {} }
  end

  def update
  end

  def destroy
  end

  private

  def success_params
    params.require(:success).permit(:name, :description, :customer_id)
  end

end