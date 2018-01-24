
class SuccessesController < ApplicationController

  before_action(except: [:index, :create]) { @success = Success.find(params[:id]) }

  def index
    company = Company.find_by(subdomain: request.subdomain)
    # data = Rails.cache.fetch("#{company.subdomain}/dt-successes") do
    data = company.successes.to_json({
        only: [:id, :name, :description],
        methods: [:display_status, :referrer, :timestamp],
        include: {
          curator: { only: [:id], methods: [:full_name] },
          customer: { only: [:id, :name, :slug] },
          story: { only: [:id, :title, :slug] }
        }
      })
    # end
    respond_to { |format| format.json { render({ json: data }) } }
  end

  def create
    if params[:imported_successes].present?
      @successes = []
      # binding.remote_pry
      params[:imported_successes].each do |index, success|
        params[:success] = success
        # binding.remote_pry
        @successes << Success.new(success_params)
      end
      binding.remote_pry
      if @successes.all? { |success| success.save }
        binding.remote_pry
      else
        @successes.each { |success| pp success.errors.full_messages }
      end
    else
      # pp success_params
      @success = Success.new(success_params)
      # pp @success
      if @success.save
        binding.remote_pry
      else
        pp @success.errors.full_messages
      end
    end
    # binding.remote_pry
    respond_to { |format| format.js {} }
  end

  def update
    @success.update(success_params)
    respond_to { |format| format.js {} }
  end

  def destroy
    @success.destroy
    respond_to do |format|
      format.json { render({ json: @success.to_json({ only: [:id] }) }) }
    end
  end

  private

  # status will be present in case of csv upload
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