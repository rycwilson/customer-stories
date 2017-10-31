
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
    # Success.new will set up all the associations, but must save contribution before success else success.save will error;
    # no such requirement for new customer
    # why is @success.errors.messages empty when success.save fails?
    # saving contribution will save contributor
    @success = Success.new(success_params)
    logger.debug "#{@success}"
    pp success_params
    pp @success
    if @success.contributions.present? &&
      @success.contributions[0].save && @success.save
    elsif @success.save
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
        :referrer_id, :crowdsourcing_template_id,
        referrer_attributes: [
          :id, :first_name, :last_name, :email, :sign_up_code, :password
        ],
      ],
    )
  end

end