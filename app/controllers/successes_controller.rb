
class SuccessesController < ApplicationController

  before_action(except: [:index, :create]) { @success = Success.find(params[:id]) }
  skip_before_action(
    :verify_authenticity_token,
    only: [:create],
    if: -> { params[:zap].present? }
  )

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
    @company = Company.find_by(subdomain: request.subdomain) || current_user.company
    if params[:zap].present?
      binding.remote_pry
    elsif params[:imported_successes].present?
      # binding.remote_pry
      # 2exp2 signatures for an imported success (each requires its own .import statement)
      # Success.import(import_signature_1(params[:imported_successes]), on_duplicate_key_updatevalidate: false)
      # Success.import(import_signature_2(params[:imported_successes]), validate: false)
      # Success.import(import_signature_3(params[:imported_successes]), validate: false)
      # Success.import(import_signature_4(params[:imported_successes]), validate: false)
      # binding.remote_pry
      @successes = []
      params[:imported_successes].each do |index, success|
        params[:success] = success
        @successes << Success.new(success_params)
        @successes.each { |s| s.save(validate: false) }
      end
    else
      binding.remote_pry
      # pp success_params
      @success = Success.new(success_params)
      # pp @success
      if @success.save
      else
        pp @success.errors.full_messages
      end
    end
    respond_to { |format| format.js {} }
  end

  def zap_create
    # binding.remote_pry
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
          :id, :email, :first_name, :last_name, :title, :sign_up_code, :password
        ],
        contributor_attributes: [
          :id, :email, :first_name, :last_name, :title, :sign_up_code, :password
        ]
      ],
    )
  end

  # both new
  def import_signature_1 (imported_successes)
    successes = []
    imported_successes.to_a.map { |s| s[1] }.keep_if do |s|
      s[:contributions_attributes]['0'][:referrer_attributes].has_key?(:password) &&
      s[:contributions_attributes]['1'][:contributor_attributes].has_key?(:password)
    end
      .each do |success|
        # params[:success] = success
        successes << Success.create(success)
      end
    # binding.remote_pry
    successes
  end

  # one existing, one new
  def import_signature_2 (imported_successes)
    successes = []
    imported_successes.to_a.map { |s| s[1] }.keep_if do |s|
      !s[:contributions_attributes]['0'][:referrer_attributes].has_key?(:password) &&
      s[:contributions_attributes]['1'][:contributor_attributes].has_key?(:password)
    end
      .each do |success|
        # params[:success] = success
        successes << Success.create(success)
      end
    # binding.remote_pry
    successes
  end

  # one new, one existing
  def import_signature_3 (imported_successes)
    successes = []
    imported_successes.to_a.map { |s| s[1] }.keep_if do |s|
      s[:contributions_attributes]['0'][:referrer_attributes].has_key?(:password) &&
      !s[:contributions_attributes]['1'][:contributor_attributes].has_key?(:password)
    end
      .each do |success|
        # params[:success] = success
        successes << Success.create(success)
      end
    # binding.remote_pry
    successes
  end

  # both existing
  def import_signature_4 (imported_successes)
    successes = []
    imported_successes.to_a.map { |s| s[1] }.keep_if do |s|
      !s[:contributions_attributes]['0'][:referrer_attributes].has_key?(:password) &&
      !s[:contributions_attributes]['1'][:contributor_attributes].has_key?(:password)
    end
      .each do |success|
        # params[:success] = success
        successes << Success.create(success)
      end
    # binding.remote_pry
    successes
  end

end