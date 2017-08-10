
class SuccessesController < ApplicationController

  before_action(except: [:index, :create]) { @success = Success.find(params[:id]) }

  def index
    company = Company.find_by(subdomain: request.subdomain)
    respond_to() do |format|
      format.json do
        render({
          json: company.successes.story_candidates.to_json({
                  only: [:id, :name, :description], methods: [:contributions_count],
                  include: {
                    curator: { only: [:id], methods: [:full_name] },
                    customer: { only: [:id, :name] }
                  }
                })
        })
      end
    end
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