
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

      # for avoiding duplicates (indexed with success index)
      # [
      #   ...,
      #   {
      #     contributor: {
      #       id: 1
      #       email: "joe@mail.com",
      #     },
      #     referrer: {
      #       id: 2
      #       email: "sue@mail.com",
      #     }
      #   }
      #   ...
      # ]
      user_lookup = []

      # binding.remote_pry
      # 2exp2 signatures for an imported success (each requires its own .import statement)
      # Success.import(import_signature_1(params[:imported_successes]), on_duplicate_key_updatevalidate: false)
      # Success.import(import_signature_2(params[:imported_successes]), validate: false)
      # Success.import(import_signature_3(params[:imported_successes]), validate: false)
      # Success.import(import_signature_4(params[:imported_successes]), validate: false)
      # binding.remote_pry

      params[:imported_successes].each do |success_index, success|

        referrer_email = get_contact_email(success, 0) || ''
        if user_lookup.any? do |success|
            [success[:referrer].try(:[], 'email'], success[:contributor].try(:[], 'email')]
              .include?(referrer_email)
          end
          # remove referrer_attributes to prevent a dup user from being created
          params[:imported_successes][success_index].except!(:referrer_attributes)
        end

        contributor_email = get_contact_email(success, 1) || ''
        if user_lookup.any? do |success|
            [success[:referrer].try(:[], 'email'), success[:contributor].try(:[], 'email')]
              .include?(contributor_email)
          end
          # remove contributor_attributes to prevent a dup user from being created
          params[:imported_successes][success_index].except!(:contributor_attributes)
        end

        params[:success] = success
        @successes << Success.new(success_params)

        # add data to the lookup table
        [referrer_email, contributor_email].each_with_index do |email, email_index|
          if email.present?
            contact_type = email_index == 0 ? 'referrer' : 'contributor'
            user_lookup[success_index][contact_type][:id] = ''
            user_lookup[success_index][contact_type][:email] = email
          end
        end
      end

      @successes.each_with_index do |success, success_index|
        success = identify_dup_users(success, success_index, user_lookup)
        puts "CREATING SUCCESS"
        pp success
        puts "CREATING CONTRIBUTIONS"
        pp success.contributions
        puts "CREATING REFERRER"
        pp success.contributions[0].try(:referrer)
        puts "CREATING CONTACT"
        pp success.contributions[1].try(:contributor)
        success.save(validate: false)  # no validate makes for faster execution
        user_lookup = update_user_lookup(success_index, success, user_lookup)
        puts "UPDATED USER LOOKUP"
        pp user_lookup
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

  # (try to avoid unneccesary db hits!)
  def identify_dup_users (success, success_index, user_lookup)
    # perform these steps for referrers/contributors that are present
    # (the contributions imply their existence),
    # but have had their attributes removed to avoid creation of dup records
    # (i.e. the contribution is there, but the referrer/contributor is not)
    if success.contributions[0].present? && success.contributions[0].referrer.blank?
      referrer_email = user_lookup[success_index][:referrer][:email]

      # find the user id and add it
      success.contributions[0].referrer_id = user_lookup.find do |success|
        success[:referrer][:email] == referrer_email ||
        success[:contributor][:email] == referrer_email
      end
        .select { |contact_type, contact_data| contact_data[:email] == referrer_email }[:id]
    end
    if success.contributions[1].present? && success.contributions[1].contributor.blank?
      contributor_email = user_lookup[success_index][:contributor][:email]

      # find the user id and add it
      success.contributions[1].contributor_id = user_lookup.find do |success|
        success[:referrer][:email] == contributor_email ||
        success[:contributor][:email] == contributor_email
      end
        .select { |contact_type, contact_data| contact_data[:email] == contributor_email }[:id]
    end
    success
  end

  # method keeps track of newly created users so no dup creates happen
  # (try to avoid unneccesary db hits!)
  def update_user_lookup (success_index, success, user_lookup)
    user_lookup[success_index] = {}
    if success.referrer.present?
      user_lookup[success_index].merge({
        referrer: { id: success.referrer[:id], email: success.referrer[:email] }
      })
    end
    if success.contact.present?
      user_lookup[success_index].merge({
        contributor: { id: success.contact[:id], email: success.contact[:email] }
      })
    end
    user_lookup
  end

  # takes an imported success and extracts referrer/contributor email (if it exists)
  # index is 0 (referrer) or 1 (contributor)
  def get_contact_email (success, index)
    success[:contributions_attributes].present? &&
    success[:contributions_attributes].try(:[], index) &&
    success[:contributions][index.to_s]["#{type}_attributes"][:email]
  end

end