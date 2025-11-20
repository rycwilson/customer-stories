# frozen_string_literal: true

class SuccessesController < ApplicationController
  include SchemaConformable

  respond_to(:html, :js, :json)

  before_action(:set_company, except: %i[update destroy])
  before_action({ except: %i[zapier_trigger index show new create import] }) { @success = Success.find(params[:id]) }
  skip_before_action(:verify_authenticity_token, only: [:create], if: -> { params[:zapier_create].present? })

  def zapier_trigger
    data = @company.successes
                   .select { |s| s.win_story_completed? && s.curator_id == params['curator_id'].to_i }
                   .to_json(
                     only: %i[id name win_story_html win_story_text win_story_markdown],
                     include: { customer: { only: %i[name description logo_url] } }
                   )
    respond_to { |format| format.json { render(json: data) } }
  end

  def index
    @wins = @company.successes.for_datatable
    respond_to(&:json)
  end

  def new
    # NOTE: customer param not presently used but useful e.g. when table is filtered by customer
    @success = Success.new(customer_id: params[:customer_id], curator_id: current_user.id)
  end

  def show
    success = @company.successes.includes(:customer).find(params[:id])
    respond_with(
      success,
      only: %i[id win_story_html win_story_text win_story_markdown win_story_completed],
      methods: [:win_story_recipients_select_options],
      include: { customer: { only: %i[id name description logo_url show_name_with_logo] } }
    )
  end

  def edit
    @success = @company.successes.includes(
      :invitation_template_identifiers,
      contributions_for_win_story: [:contributor],
      contributor_answers: [:contributor_question]
    ).find(params[:id])
    render(partial: 'edit', locals: { success: @success })
  end

  def create
    # puts JSON.pretty_generate(success_params.to_h)
    win_attrs = find_dup_customer(success_params.to_h.deep_dup, @company)

    %i[referrer_attributes contributor_attributes].each_with_index do |new_user_key, index|
      new_user_attrs = win_attrs.dig(:contributions_attributes, index.to_s, new_user_key)
      next unless new_user_attrs.present?

      if (new_user_attrs = find_dup_user(new_user_attrs)).present?
        win_attrs[:contributions_attributes][index.to_s][new_user_key] = new_user_attrs
      else
        win_attrs[:contributions_attributes].delete(index.to_s)
      end
    end

    @success = Success.new(win_attrs)
    if @success.save
      flash.now[:notice] = 'Customer Win was created successfully'
      @row_data = render_to_string( \
        partial: 'successes/show',
        formats: [:json],
        locals: { win: Success.for_datatable(@success.id).take }
      )
      @row_partial = render_to_string(partial: 'successes/edit', locals: { success: @success })

      # TODO: We also need to pass any newly created customer or contributions to the response
      # @contributions_row_data = @success.contributions.present? && render_to_string( \
      #   partial: 'contributions/show',
      #   formats: [:json],
      #   locals: { contributions: @success.contributions }
      # )
      respond_to do |format|
        format.turbo_stream {}

        # What a pure json response utilizing jbuilder would look like:
        # format.json do
        #   render(partial: 'successes/show', locals: { win: Success.for_datatable(@success.id).take })
        # end
      end
    else
      # TODO: test that server side validation works when there is a duplicate name
      @errors = @success.errors.full_messages
      render :new
    end

    # if params[:zapier_create].present? && (@success = Success.find_by_id(find_dup_success(success_params.to_h)))
    #   # a new success entails two contributions, one for the contact and one for the referrer;
    #   # a duplicate success means a new contributor, i.e. one contribution only;
    #   # referrers only get a contribution when they refer the original customer contact
    #   @success = consolidate_contributions(@success)
    #   zap_status = 'success' if @success.update(success_params)
    # else
    #   @success = Success.new(success_params)
    #   if @success.save
    #   else
    #     pp @success.errors.full_messages
    #   end
    # end
    # # end
    # if params[:zapier_create].present?
    #   puts "Zapier -> CSP, create success (after processing)"
    #   puts success_params.to_h
    #   respond_to do |format|
    #     format.any do
    #       render({
    #         json: {
    #           status: (@success && @success.persisted?) || zap_status == 'success' ? 'success' : 'error'
    #         }
    #       })
    #     end
    #   end
    # else
    #   respond_to { |format| format.js {} }
    # end
  end

  def import
    # awesome_print params[:imported_successes]
    @successes = []
    success_lookup = {}   # { name: { id: 1, customer_id: 1 } }
    customer_lookup = {}  # { name: id }
    user_lookup = {}      # { email: id }
    template_lookup = {}  # { name: id }

    params[:imported_successes].each do |success_index, imported_success|

      if (customer_id = find_dup_imported_customer(imported_success, customer_lookup))
        imported_success[:customer_id] = customer_id
        imported_success.except!(:customer_attributes)
      else
        imported_success.except!(:customer_id)
      end
      referrer_email = contact_email = ''
      referrer_template = contact_template = ''
      ['referrer', 'contributor'].each do |contact_type|
        # if a referrer/contact, look for id in user_lookup
        if (email = dig_contact_email(imported_success, contact_type))
          contact_type == 'referrer' ? referrer_email = email : contact_email = email
        end
        if (template = dig_contact_template(imported_success, contact_type))
          contact_type == 'referrer' ? referrer_template = template : contact_template = template
        end
      end

      imported_success = find_dup_imported_users_and_templates(
        imported_success, user_lookup, template_lookup, referrer_email, contact_email, referrer_template, contact_template
      )

      if (imported_success_id = find_dup_success(imported_success, success_lookup))
        new_contribution = build_contribution_from_import(imported_success, imported_success_id)
        # create a new contribution if a contributor is present (new or existing)
        if new_contribution[:contributor_attributes].present?
          params[:contribution] = new_contribution
          # puts "\n\nCREATING CONTRIBUTION\n"
          # awesome_print contribution_params
          Contribution.create(contribution_params)
          # puts "\nERRORS:\n"
          # puts contribution.errors.full_messages
        else
          # ignore this imported success
        end
      else
        params[:success] = imported_success
        success = Success.new(success_params)
        # puts "\n\nCREATING SUCCESS\n"
        # awesome_print success
        success.save(validate: false)  # no validate makes for faster execution
        # puts "\nERRORS:\n"
        # puts success.errors.full_messages
        @successes << success
      end

      # reload to capture any additional contributions
      @successes.each { |s| s.reload }

      # add entries to the lookup tables
      # if a success wasn't saved, that implies duplicate success/customer => no lookup addition necessary
      if success.present? && !success_lookup.has_key?(success.name)
        success_lookup[success.name] = { id: success.id, customer_id: success.customer_id }
        # this one needs to be conditional since possible this is dup customer
        customer_lookup[success.customer.name] ||= success.customer_id
      end

      [referrer_email, contact_email].each_with_index do |email, index|
        if success.present? && email.present?
          user_lookup[email] ||= (index == 0 ? success.referrer[:id] : success.contact[:id])
        elsif email.present?
          user_lookup[email] ||= User.find_by_email(email).id
        end
      end

      [referrer_template, contact_template].each do |template|
        if template.present?
          template_lookup[template] ||= InvitationTemplate.where(name: template, company_id: @company.id).take.id
        end
      end
    end
    respond_to { |format| format.js { render({ action: 'import' }) } }
  end

  def update
    params[:success][:win_story_completed] = ActiveRecord::Type::Boolean.new.cast(success_params[:win_story_completed])
    respond_to do |format|
      if @success.update(success_params)
        format.json do
          render(json: @success, only: %i[id win_story_completed], methods: %i[display_status previous_changes])
        end
      else
        format.json { render(json: { errors: @success.errors.full_messages }) }
      end
    end
  end

  def destroy
    @success.destroy
    head(:ok)
  end

  private

  # status will be present in case of csv upload
  def success_params
    params.require(:success).permit(
      :name,
      :win_story_html,
      :win_story_text,
      :win_story_markdown,
      :win_story_completed,
      :customer_id,
      :curator_id,
      customer_attributes: %i[id name company_id],
      contributions_attributes: [
        :contributor_id, :referrer_id, :invitation_template_id, :success_contact,
        {
          contributor_attributes:
            %i[id email first_name last_name title phone sign_up_code password],
          referrer_attributes:
            %i[id email first_name last_name title phone sign_up_code password],
          invitation_template_attributes: %i[name company_id]
        }
      ]
    )
  end

  # find a success previously created in this import (or in db) and return id
  def find_dup_success(success, success_lookup = nil)
    if success[:customer_id].present? && success[:customer_id] == success_lookup.dig(success[:name], :customer_id)
      success_lookup[success[:name]][:id]
    elsif (success_id = Success.where({ name: success[:name], customer_id: success[:customer_id]}).take.try(:id))
      success_id
    end
  end

  # find a customer previously created in this import and return id;
  # customers existing prior to the import are id'ed in the client
  def find_dup_imported_customer(success, customer_lookup)
    if success[:customer_id].present? # dup customer id'ed in the client
      success[:customer_id]
    else
      success.dig(:customer_attributes, :name) && customer_lookup[success.dig(:customer_attributes, :name)]
    end
  end

  # fill in the id of an existing user, and removes the referrer/contributor_attributes hash
  def add_dup_contact(success, contact_type, user_id)
    contribution_index = success[:contributions_attributes].select do |_index, contribution|
      contribution.key?("#{contact_type}_id") or contribution.key?("#{contact_type}_attributes")
    end.keys[0]
    success[:contributions_attributes][contribution_index]["#{contact_type}_id"] = user_id
    success[:contributions_attributes][contribution_index].except!("#{contact_type}_attributes")
    success
  end

  # fill in the id of an existing template, and remove invitation_template_attributes hash
  def add_dup_template(success, contact_type, template_id)
    contribution_index = success[:contributions_attributes].select do |_index, contribution|
      contribution.key?("#{contact_type}_id") or contribution.key?("#{contact_type}_attributes")
    end.keys[0]
    success[:contributions_attributes][contribution_index][:invitation_template_id] = template_id
    success[:contributions_attributes][contribution_index].except!(:invitation_template_attributes)
    success
  end

  def find_dup_imported_users_and_templates(success, user_lookup, template_lookup, referrer_email, contact_email, referrer_template, contact_template)
    ['referrer', 'contributor'].each do |contact_type|
      email = contact_type == 'referrer' ? referrer_email : contact_email
      template = contact_type == 'referrer' ? referrer_template : contact_template
      if (user_id = (user_lookup[email] || User.find_by_email(email).try(:id)))
        success = add_dup_contact(success, contact_type, user_id)
      end
      if (template_id = (template_lookup[template] || InvitationTemplate.where({
                                                          name: template,
                                                          company_id: @company.id
                                                        }).take.try(:id) ))
        success = add_dup_template(success, contact_type, template_id)
      end
    end
    success
  end

  # takes an imported success and extracts referrer/contributor email (if it exists)
  def dig_contact_email(success, contact_type)
    success.dig(:contributions_attributes, '0', "#{contact_type}_attributes", :email) or
      success.dig(:contributions_attributes, '1', "#{contact_type}_attributes", :email)
  end

  def dig_contact_template(success, contact_type)
    return unless success[:contributions_attributes].present?

    contribution_index = success[:contributions_attributes].select do |_index, contribution|
      contribution.key?("#{contact_type}_id") or contribution.key?("#{contact_type}_attributes")
    end.keys[0]
    success.dig(:contributions_attributes, contribution_index, :invitation_template_attributes, :name)
  end

  # duplicate successes are allowed for a zap; they will contain new contributors
  # but not allowed if also a dup contributor (dup referrer ok)
  # NOTE no id values will be available in a zap
  # def ignore_zap? (success)
  #   if existing_success = Success.includes(:contributions)
  #                                .joins(:customer)
  #                                .where({ name: success[:name] })
  #                                .where({
  #                                   customers: {
  #                                     name: success.dig(:customer_attributes, :name),
  #                                     company_id: current_user.company_id
  #                                   },
  #                                 })
  #                                .take
  #     # this is a dup success; check for new contributor
  #     contributor_email = success.dig(:contributions_attributes, '1', :contributor_attributes, :email)
  #     if (User.find_by_email(contributor_email) &&
  #         existing_success.contributions.any? { |c| c.contributor.email == contributor_email })
  #       true  # user already has a contribution for this success
  #     else
  #       false
  #     end
  #   else
  #     false
  #   end
  # end


  def build_contribution_from_import (success, success_id)
    puts "\n\nBUILDING CONTRIBUTION FOR SUCCESS #{success_id}\n"
    awesome_print success
    contribution = {
      success_id: success_id,
      contributor_attributes: {},
      referrer_attributes: {},
      invitation_template_attributes: {}
    }
    contact_index = success[:contributions_attributes].select do |index, c|
      c.has_key?("contributor_id") || c.has_key?("contributor_attributes")
    end.keys[0]
    referrer_index = success[:contributions_attributes].select do |index, c|
      c.has_key?("referrer_id") || c.has_key?("referrer_attributes")
    end.keys[0]

    referrer_id = success.dig(:contributions_attributes, referrer_index, :referrer_id)
    referrer_attrs = success.dig(:contributions_attributes, referrer_index, :referrer_attributes)
    contributor_id = success.dig(:contributions_attributes, contact_index, :contributor_id)
    contributor_attrs = success.dig(:contributions_attributes, contact_index, :contributor_attributes)
    invitation_template_id = success.dig(:contributions_attributes, contact_index, :invitation_template_id)
    invitation_template_attrs = success.dig(:contributions_attributes, contact_index, :invitation_template_attributes)

    if referrer_id.present?
      contribution[:referrer_id] = referrer_id
      contribution.except!(:referrer_attributes)
    elsif referrer_attrs.present?
      contribution[:referrer_attributes].merge!(referrer_attrs)
    else
      contribution.except!(:referrer_attributes)
    end
    if contributor_id.present?
      contribution[:contributor_id] = contributor_id
      contribution.except!(:contributor_attributes)
    elsif contributor_attrs.present?
      contribution[:contributor_attributes].merge!(contributor_attrs)
    else
      contribution.except!(:contributor_attributes)
    end
    if invitation_template_id.present?
      contribution[:invitation_template_id] = invitation_template_id
      contribution.except!(:invitation_template_attributes)
    elsif invitation_template_attrs.present?
      contribution[:invitation_template_attributes].merge!(invitation_template_attrs)
    else
      contribution.except!(:invitation_template_attributes)
    end
    contribution
  end

  # method takes a success from a zap and combines data from each of two possible contributions
  # into a single contribution.
  def consolidate_contributions (success)
    success[:contributions_attributes]['1'][:success_contact] = false
    success[:contributions_attributes]['1'][:referrer_attributes] =
      success[:contributions_attributes]['0'][:referrer_attributes]
    success[:contributions_attributes].except!('0')
    success
  end

  # for activerecord-import ...
  # 2exp2 signatures for an imported success (each requires its own .import statement)
  # Success.import(import_signature_1(params[:imported_successes]), on_duplicate_key_updatevalidate: false)
  # Success.import(import_signature_2(params[:imported_successes]), validate: false)
  # Success.import(import_signature_3(params[:imported_successes]), validate: false)
  # Success.import(import_signature_4(params[:imported_successes]), validate: false)
  #
  # both new
  # def import_signature_1 (imported_successes)
  #   successes = []
  #   imported_successes.to_a.map { |s| s[1] }.keep_if do |s|
  #     s[:contributions_attributes]['0'][:referrer_attributes].has_key?(:password) &&
  #     s[:contributions_attributes]['1'][:contributor_attributes].has_key?(:password)
  #   end
  #     .each do |success|
  #       # params[:success] = success
  #       successes << Success.create(success)
  #     end
  #   successes
  # end

  # # one existing, one new
  # def import_signature_2 (imported_successes)
  #   successes = []
  #   imported_successes.to_a.map { |s| s[1] }.keep_if do |s|
  #     !s[:contributions_attributes]['0'][:referrer_attributes].has_key?(:password) &&
  #     s[:contributions_attributes]['1'][:contributor_attributes].has_key?(:password)
  #   end
  #     .each do |success|
  #       # params[:success] = success
  #       successes << Success.create(success)
  #     end
  #   successes
  # end

  # # one new, one existing
  # def import_signature_3 (imported_successes)
  #   successes = []
  #   imported_successes.to_a.map { |s| s[1] }.keep_if do |s|
  #     s[:contributions_attributes]['0'][:referrer_attributes].has_key?(:password) &&
  #     !s[:contributions_attributes]['1'][:contributor_attributes].has_key?(:password)
  #   end
  #     .each do |success|
  #       # params[:success] = success
  #       successes << Success.create(success)
  #     end
  #   successes
  # end

  # # both existing
  # def import_signature_4 (imported_successes)
  #   successes = []
  #   imported_successes.to_a.map { |s| s[1] }.keep_if do |s|
  #     !s[:contributions_attributes]['0'][:referrer_attributes].has_key?(:password) &&
  #     !s[:contributions_attributes]['1'][:contributor_attributes].has_key?(:password)
  #   end
  #     .each do |success|
  #       # params[:success] = success
  #       successes << Success.create(success)
  #     end
  #   successes
  # end

end