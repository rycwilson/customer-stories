
class SuccessesController < ApplicationController

  before_action(except: [:index, :create]) { @success = Success.find(params[:id]) }

  def index
    company = Company.find_by(subdomain: request.subdomain)
    # data = Rails.cache.fetch("#{company.subdomain}/dt-successes") do
    data = company.successes.to_json({
        only: [:id, :name, :description],
        methods: [:display_status, :referrer, :contact, :timestamp],
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
    @company = Company.find_by(subdomain: request.subdomain)
    if params[:imported_successes].present?
      binding.remote_pry
      # Success.import(params[:imported_successes].to_a.map { |s| s[1] }, validate: false)
      # binding.remote_pry
      # @successes = @company.successes.select { |s| s.previous_changes.id.present? }
      # @successes = []
      # params[:imported_successes].each do |index, success|
      #   params[:success] = success
      #   @successes << Success.create(success_params)
      # end
    else
      # pp success_params
      @success = Success.new(success_params)
      # pp @success
      if @success.save
      else
        pp @success.errors.full_messages
      end
    end
    # respond_to { |format| format.js {} }
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
        :referrer_id, :contributor_id, :crowdsourcing_template_id, :success_contact,
        referrer_attributes: [
          :first_name, :last_name, :email, :sign_up_code, :password
        ],
        contributor_attributes: [
          :first_name, :last_name, :email, :sign_up_code, :password
        ]
      ],
    )
  end

end