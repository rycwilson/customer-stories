
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
      @successes = []
      customer_lookup = {}
      user_lookup = {}

      # binding.remote_pry
      # 2exp2 signatures for an imported success (each requires its own .import statement)
      # Success.import(import_signature_1(params[:imported_successes]), on_duplicate_key_updatevalidate: false)
      # Success.import(import_signature_2(params[:imported_successes]), validate: false)
      # Success.import(import_signature_3(params[:imported_successes]), validate: false)
      # Success.import(import_signature_4(params[:imported_successes]), validate: false)
      # binding.remote_pry

      params[:imported_successes].each do |success_index, imported_success|

        customer_name = imported_success[:customer_attributes][:name]
        if (customer_id = customer_lookup[customer_name])
          imported_success[:customer_id] = customer_id
          imported_success.except!(:customer_attributes)
        end

        referrer_email = get_contact_email(imported_success, 'referrer') || ''
        if (user_id = user_lookup[referrer_email])
          imported_success[:contributions_attributes]['0'][:referrer_id] = user_id
          imported_success[:contributions_attributes]['0'].except!(:referrer_attributes)
        end

        contributor_email = get_contact_email(imported_success, 'contributor') || ''
        if (user_id = user_lookup[contributor_email])
          imported_success[:contributions_attributes]['1'][:contributor_id] = user_id
          imported_success[:contributions_attributes]['1']  .except!(:contributor_attributes)
        end

        params[:success] = imported_success
        success = Success.new(success_params)

        # puts "CREATING SUCCESS"
        # pp success
        # puts "CREATING CONTRIBUTIONS"
        # pp success.contributions
        # puts "CREATING REFERRER"
        # pp success.contributions[0].try(:referrer)
        # puts "CREATING CONTACT"
        # pp success.contributions[1].try(:contributor)

        success.save(validate: false)  # no validate makes for faster execution
        @successes << success

        # add entries to the lookup tables
        customer_lookup[customer_name] ||= success.customer.id
        [referrer_email, contributor_email].each_with_index do |email, index|
          if email.present? && !user_lookup.has_key?(email)
            user_lookup[email] = (index == 0 ? success.referrer[:id] : success.contact[:id])
          end
        end
        # puts "UPDATED LOOKUPS"
        # pp customer_lookup
        # pp user_lookup
      end
    else
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

  # takes an imported success and extracts referrer/contributor email (if it exists)
  def get_contact_email (success, contact_type)
    success.dig(
      :contributions_attributes,
      "#{contact_type == 'referrer' ? '0' : '1'}",
      "#{contact_type}_attributes",
      :email
    )
    # success[:contributions_attributes].present? &&
    # success[:contributions_attributes].try(:[], index.to_s) &&
    # success[:contributions][index.to_s]
    #   ["#{index == 0 ? 'referrer' : 'contributor'}_attributes"][:email]
  end

end