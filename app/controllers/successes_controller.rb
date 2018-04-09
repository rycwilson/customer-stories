
class SuccessesController < ApplicationController

  # respond_to(:html, :js, :json)

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
    @company = Company.find_by(subdomain: request.subdomain)

    if params[:imported_successes].present?
      @successes = []
      customer_lookup = {}
      user_lookup = {}
      template_lookup = {}

      # binding.remote_pry
      # 2exp2 signatures for an imported success (each requires its own .import statement)
      # Success.import(import_signature_1(params[:imported_successes]), on_duplicate_key_updatevalidate: false)
      # Success.import(import_signature_2(params[:imported_successes]), validate: false)
      # Success.import(import_signature_3(params[:imported_successes]), validate: false)
      # Success.import(import_signature_4(params[:imported_successes]), validate: false)
      # binding.remote_pry

      params[:imported_successes].each do |success_index, imported_success|

        # if a new customer, look for id in customer_lookup
        if (customer_name = imported_success.dig(:customer_attributes, :name))
          if customer_name.present? && (customer_id = customer_lookup[customer_name])
            imported_success[:customer_id] = customer_id
            imported_success.except!(:customer_attributes)
          end
        end

        referrer_email = contact_email = ''
        referrer_template = contact_template = ''
        ['referrer', 'contributor'].each do |contact_type|

          # if a new referrer/contact, look for id in user_lookup
          if (email = dig_contact_email(imported_success, contact_type))
            contact_type == 'referrer' ? referrer_email = email : contact_email = email
            if (user_id = user_lookup[email])
              imported_success = add_dup_contact(imported_success, contact_type, user_id)
            end
          end

          # if a new invitation template, look for in in template_lookup
          if (template = dig_contact_template(imported_success, contact_type))
            contact_type == 'referrer' ? referrer_template = template : contact_template = template
            if (template_id = template_lookup[template])
              imported_success = add_dup_template(imported_success, contact_type, template_id)
            end
          end

        end

        params[:success] = imported_success
        success = Success.new(success_params)
        success.save(validate: false)  # no validate makes for faster execution
        @successes << success

        # add entries to the lookup tables
        customer_lookup[customer_name] ||= success.customer_id
        [referrer_email, contact_email].each_with_index do |email, index|
          if email.present? && !user_lookup.has_key?(email)
            user_lookup[email] = (index == 0 ? success.referrer[:id] : success.contact[:id])
          end
        end
        [referrer_template, contact_template].each do |template|
          if template.present? && !template_lookup.has_key?(template)
            template_lookup[template] = CrowdsourcingTemplate.where(name: template, company_id: @company.id).take.id
          end
        end

      end
    else
      if params[:zap].present?
        # use customer name and user emails to find id attributes
        find_existing_customer_from_zap(params[:success][:customer_attributes])
        find_existing_users_from_zap(
          params[:success][:contributions_attributes]['0'][:referrer_attributes],
          params[:success][:contributions_attributes]['1'][:contributor_attributes]
        )
      end
      unless params[:zap].present? && ignore_zap?(params[:success])
        @success = Success.new(success_params)
        if @success.save
        else
          pp @success.errors.full_messages
        end
      end
    end
    if params[:zap].present?
      puts "FORMAT.ANY"
      respond_to do |format|
        format.any { render({ json: { status: @success && @success.persisted? ? "success" : "error" } }) }
      end
    else
      puts "FORMAT.JS"
      respond_to { |format| format.js {} }
    end
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
    params.require(:success).permit(
      :name, :description, :customer_id, :curator_id,
      customer_attributes: [:id, :name, :company_id],
      contributions_attributes: [
        :referrer_id, :contributor_id, :crowdsourcing_template_id, :success_contact,
        crowdsourcing_template_attributes: [:name, :company_id],
        referrer_attributes: [
          :id, :email, :first_name, :last_name, :title, :phone, :sign_up_code, :password
        ],
        contributor_attributes: [
          :id, :email, :first_name, :last_name, :title, :phone, :sign_up_code, :password
        ]
      ]
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

  # method receives params[:success][:customer_attributes] and either
  # - finds customer, or
  # - provides company_id for the new customer
  def find_existing_customer_from_zap (customer_params)
    if (customer = Customer.where(name: customer_params[:name], company_id: current_user.company_id).take)
      customer_params[:id] = customer.id
      customer_params.delete_if { |k, v| k != 'id' }
    else
      customer_params[:company_id] = current_user.company_id
    end
  end

  def find_existing_users_from_zap (referrer_params, contributor_params)
    if (referrer = User.find_by_email(referrer_params[:email]))
      referrer_params[:id] = referrer.id
      referrer_params.delete_if { |k, v| !['id', 'title', 'phone'].include?(k) }
    end
    if (contributor = User.find_by_email(contributor_params[:email]))
      contributor_params[:id] = contributor.id
      contributor_params.delete_if { |k, v| !['id', 'title', 'phone'].include?(k) }
    end
  end

  # takes an imported success and extracts referrer/contributor email (if it exists)
  def dig_contact_email (success, contact_type)
    success.dig(:contributions_attributes, '0', "#{contact_type}_attributes", :email) ||
    success.dig(:contributions_attributes, '1', "#{contact_type}_attributes", :email)
  end

  def dig_contact_template (success, contact_type)
    contribution_index = success[:contributions_attributes].select do |index, contribution|
      contribution.has_key?("#{contact_type}_id") ||
      contribution.has_key?("#{contact_type}_attributes")
    end.keys[0]
    success.dig(
      :contributions_attributes,
      contribution_index,
      :crowdsourcing_template_attributes,
      :name
    )
  end

  # method fills in the id of an existing user, and removes the referrer/contributor_attributes hash
  def add_dup_contact (success, contact_type, user_id)
    contribution_index = success[:contributions_attributes].select do |index, contribution|
      contribution.has_key?("#{contact_type}_attributes")
    end.keys[0]
    success[:contributions_attributes][contribution_index]["#{contact_type}_id"] = user_id
    success[:contributions_attributes][contribution_index].except!("#{contact_type}_attributes")
    success
  end

  def add_dup_template (success, contact_type, template_id)
    contribution_index = success[:contributions_attributes].select do |index, contribution|
      contribution.has_key?("#{contact_type}_attributes")
    end.keys[0]
    success[:contributions_attributes][contribution_index][:crowdsourcing_template_id] = template_id
    success[:contributions_attributes][contribution_index].except!([:crowdsourcing_template_attributes])
    success
  end

  def ignore_zap? (success)
    # dup success (name) and customer combination
    # (customer_id is available since this runs after find_existing_customer_from_zap
    if Success.joins(:customer)
              .where(name: success[:name])
              .where(customers: { id: success[:customer_id] })
              .present?
      true
    else
      false
    end
  end

end