class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery(with: :exception)
  add_flash_types(:info, :warning)
  impersonates(:user)
  helper_method(:company_admin_page?)
  
  before_action(unless: :skip_subdomain_authorization?) do 
    if unauthorized_subdomain?
      redirect_to(current_user.company.blank? ? new_company_url(subdomain: '') : public_stories_url(subdomain: current_user.company.subdomain))
    end
  end
  before_action({ only: [:linkedin_auth_callback] }) { linkedin_authenticated?(params[:state]) }
  before_action(if: [:company_admin_page?, :impersonating_user?]) { flash.now[:warning] = "Impersonating user: #{current_user.full_name}" }
  before_action(:set_footer_links, if: -> { (controller_name == 'site') || :devise_controller? })

  def auth_test
    respond_to do |format|
      format.any do  # zapier sends GET request with Accept = */* (any format permissable)
        render({
          # content_type: 'application/json',  # not necessary
          json: { user: { email: current_user.email, company_id: current_user.company_id } },
          status: 200
        })
      end
    end
  end

  def linkedin_auth
    auth_url = user_signed_in? && current_user.company.present? ?
      CURATOR_LINKEDIN_AUTH_URL :
      CONTRIBUTOR_LINKEDIN_AUTH_URL

    # embed any data needed in the callback in the state param
    # (adding a separate param will cause a failure, won't match registered callback urls)
    if params[:contribution_id].present?
      csp_data = "csp-contribution-#{params[:contribution_id]}"
    elsif params[:share_url].present?
      # bookend the data since we don't know enough about it to delimit it
      csp_data = "csp-share-#{ ERB::Util.url_encode(params[:share_url]) }-csp-share"
    end
    auth_url.sub!(/state=(.+)$/, 'state=\1' + (csp_data || ''))
    redirect_to(
      auth_url + "&redirect_uri=#{ ERB::Util.url_encode(linkedin_auth_callback_url) }"
    )
  end

  def linkedin_auth_callback
    # puts params.permit(params.keys).to_h
    # share_url = params[:state].match(/csp-share(.+)csp-share/).try(:[], 1)
    # profile_type = # lite or basic

    # contribution submission
    if contribution = Contribution.find_by(
          id: params[:state].match(/csp-contribution-(\d+)$/).try(:[], 1)
        )
      puts "CONTRIBUTION #{contribution.id}"
      if request.subdomain.empty?  # insert subdomain and re-direct
        redirect_to(
          url_for({ subdomain: company.subdomain, params: request.params })
        ) and return
      end
      if params[:error]
        redirect_to(
          confirm_submission_path(contribution.access_token),
          flash: { warning: params[:error_description] }
        )
      elsif params[:code]
        token_response = get_linkedin_token(params[:code])
        if token_response['error']
          redirect_to(
            confirm_submission_path(contribution.access_token),
            flash: { danger: 'LinkedIn error: ' + token_response['error_description'] }
          )
        else
          token = token_response['access_token']
          # save token to User model
          # linkedin_data = get_linkedin_profile(token, 'lite')
        end
      end

    else  # signed in user (likely curator, could be contributor)
      if params[:error]
        redirect_to(
          edit_profile_path,
          flash: { warning: params[:error_description] }
        )
      elsif params[:code] # code returned, now get access token
        token_response = get_linkedin_token(params[:code])
        if token_response['error']
          redirect_to(
            edit_profile_path,
            flash: { danger: 'LinkedIn error: ' + token_response['error_description'] }
          )
        else
          token = token_response['access_token']
          puts "TOKEN"
          puts token
          # save token to User model
          get_linkedin_profile(token, 'lite')

          if false # errors
            # what if linkedin api is down?  timeout?
            # since this is all happening in the same flow, a 401 response won't happen;
            # but further authenticated requests (from linkedin_connect action)
            # need to account for possibility of 401, re-direct to beginning of auth process
          else

          # not checking for errors here,
          # what's the point of telling contributor?
          # if update_user_linkedin_data(contributor, linkedin_data)
          #   redirect_to confirm_submission_path(contribution.access_token)
          # else
          #   redirect_to confirm_submission_path(contribution.access_token),
          #       flash: {
          #         warning: "Submission successful, but errors saving LinkedIn data: #{contributor.errors.full_messages.join(', ')}"
          #       }
          end
        end
      end
    end
  end

  protected

  def csp_environment
    if ENV['HOST_NAME'] == 'customerstories.net'
      return 'production'
    elsif ENV['HOST_NAME'] == 'customerstories.org'
      return 'staging'
    else
      return 'development'
    end
  end

  def after_sign_in_path_for current_resource
    if session[:user_return_to].present?
      session[:user_return_to]
    elsif current_resource.class.name == 'User'
      if current_resource.company.present?
        dashboard_url('curate', subdomain: current_resource.company.subdomain)
      else
        edit_user_registration_path
      end
    elsif current_resource.class.name == 'Admin'
      rails_admin_path
    end
  end

  def after_sign_out_path_for resource
    if request.subdomain.present?
      if @not_authorized_for_subdomain
        new_session_url(subdomain: '')
      else
        public_stories_url(subdomain: request.subdomain)
      end
    else
      new_session_url(subdomain: '')
    end
  end

  def set_s3_direct_post
    @s3_direct_post = S3_BUCKET.presigned_post(key: "uploads/#{SecureRandom.uuid}/${filename}", success_action_status: '201')
  end

  def company_curator? company_id
    user_signed_in? &&
    current_user.company_id == company_id
  end

  def set_contributors (story)
    @contributors =
      User.joins(own_contributions: { success: {} })
          .where.not(linkedin_url: [nil, ''])
          .where(
            successes: { id: story.success_id },
            contributions: { publish_contributor: true }
          )
          .order(Arel.sql(
            "CASE contributions.role
              WHEN 'customer' THEN '1'
              WHEN 'customer success' THEN '2'
              WHEN 'sales' THEN '3'
            END"
          ))
          .to_a
          .delete_if { |c| c.id == story.curator.id }
  end

  private

  def skip_subdomain_authorization?
    not user_signed_in? or
    signing_in_or_out? or  # users/sessions#create will handle subdomain authorization independently
    public_page? or
    turbo_frame_request? or
    request.subdomain == DEV_TUNNEL_SUBDOMAIN or
    controller_name == 'plugins' or
    action_name == 'not_found'
  end

  def signing_in_or_out?
    controller_name == 'sessions' and action_name.in? ['create', 'destroy']
  end

  def public_page?
    controller_name == 'stories' and action_name.in? ['index', 'show'] or controller_name == 'contributions'
  end

  def company_admin_page?
    controller_name == 'companies' && action_name.in?(['new', 'show', 'edit']) or
    controller_name == 'registrations' && action_name == 'edit' or
    controller_name == 'stories' && action_name == 'edit'
  end

  def impersonating_user?
    user_signed_in? and current_user != true_user
  end

  def unauthorized_subdomain?
    session['authorized_subdomains']&.exclude?(request.subdomain)
  end

  def get_linkedin_token(code)
    token_request = Typhoeus::Request.new(
      LINKEDIN_TOKEN_BASE_URL,
      method: 'POST',
      params: {
        grant_type: 'authorization_code',
        code: code,
        client_id: ENV['LINKEDIN_KEY'],
        client_secret: ENV['LINKEDIN_SECRET'],
        redirect_uri: linkedin_auth_callback_url
      }
    )
    token_request.run
    JSON.parse(token_request.response.response_body)
  end

  def get_linkedin_profile(token, type)  # type is 'lite' or 'basic'
    data_request = Typhoeus::Request.new(
      LINKEDIN_PROFILES_BASE_URL,
        # ":(location:(name),\
        #    positions,\
        #    public-profile-url,\
        #    picture-urls::(original))".gsub(/\s+/, ''),
      method: 'GET',
      headers: { Authorization: "Bearer #{token}" }
    )
    data_request.run
    # puts "PROFILE"
    # puts JSON.parse(data_request.response.response_body)
    JSON.parse(data_request.response.response_body)
  end

  def linkedin_authenticated?(state_param)
    if state_param == ENV['LINKEDIN_STATE'] ||
      # if contribution submission, state param tagged with contribution
      ( state_param.match(/csp-contribution(\d+)/) &&
        state_param.sub(/csp-contribution-(\d+)/, '' ) == ENV['LINKEDIN_STATE'] )
      true
    else
      render file: 'public/401', status: 401, layout: false
      false
    end
  end

  def linkedin_auth_callback_url
    url_for({
      subdomain: nil,
      controller: 'application',
      action: 'linkedin_auth_callback'
    })
  end

  def set_footer_links
    @footer_links = %w(terms privacy company our-story).map do |path| 
      [ path, File.join(root_url(subdomain: nil), path) ]
    end.to_h
  end
end
