class ApplicationController < ActionController::Base

  layout(:layout)


  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  before_action { }

  # Devise - whitelist User params
  before_action :configure_permitted_parameters, if: :devise_controller?

  before_action(
    :check_subdomain,
    if: Proc.new { user_signed_in? },
    unless: Proc.new do
      devise_controller? ||
      invalid_subdomain? ||
      params[:controller] == 'plugins' ||
      params[:action] == 'zapier_trigger' ||
      request.subdomain == 'cspdev'
    end
  )

  helper_method :company_curator?

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
    auth_url = PIXLEE_LINKEDIN_AUTHORIZE_BASE_URL
    if params[:share_url].present?
      auth_url.sub!(
        /state=(\w+)&$/,
        'state=\1' + "cs-share#{ ERB::Util.url_encode(params[:share_url]) }cs-share&" +
        "redirect_uri=#{ ERB::Util.url_encode('https://customerstories.org/linkedin_auth_callback') }"
      )
    end
    puts auth_url
    redirect_to auth_url
  end

  def linkedin_auth_callback
    # puts params.permit(params.keys).to_h
    if share_url = params[:state].match(/cs-share(.+)cs-share/).try(:[], 1)
      redirect_url = share_url
    else
      # ...
    end
    if params[:code]
      token_response = get_linkedin_token(
                         params[:code],
                         url_for({
                           subdomain: nil,
                           controller: 'application',
                           action: 'linkedin_auth_callback'
                         })
                       )
      if token_response['error']
        puts "TOKEN ERROR"
        puts token_response['error']
        redirect_to redirect_url
        # flash messaging depends on source
      else
        token = token_response['access_token']
        puts "TOKEN SUCCESS"
        puts token
        puts token_response
        if share_url
          profile_request = Typhoeus::Request.new(
            'https://api.linkedin.com/v2/me',
            method: 'GET',
            headers: { Authorization: "Bearer #{token}" }
          )
          profile_request.run
          profile_response = JSON.parse(profile_request.response.response_body)
          puts "PROFILE"
          puts profile_response
          share_request = Typhoeus::Request.new(
            'https://api.linkedin.com/v2/ugcPosts',
            method: 'POST',
            headers: {
              Authorization: "Bearer #{token}",
              'X-Restli-Protocol-Version': '2.0.0'
            },
            body: {
              "author": profile_response[:id],
              "lifecycleState": "PUBLISHED",
              "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                  "shareCommentary": {
                    "text": "This is share commentary"
                  },
                  "shareMediaCategory": "NONE"
                }
              },
              "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
              }
            }
          )
          share_request.run
          share_response = JSON.parse(share_request.response.response_body)
          puts "SHARE"
          puts share_response
        end
      end
      redirect_to redirect_url
    else
      # error?
    end
  end

  protected

  def set_gon (company=nil)
    is_curator = (user_signed_in? && (current_user.company_id == company.try(:id)))
    gon.push({
      company: company.present? ? JSON.parse(company.to_json({
        methods: [:curators, :customers, :invitation_templates, :plugin],
      })) : nil,
      current_user: user_signed_in? ? {
        id: current_user.id,
        first_name: current_user.first_name,
        last_name: current_user.last_name,
        name: current_user.full_name,
        title: current_user.title,
        email: current_user.email,
        phone: current_user.phone,
        photo: current_user.photo_url,
        is_curator: is_curator
      } : nil,
      stories: company.present? ? company.stories_json : nil,
      env: csp_environment
    })
  end

  def csp_environment
    if ENV['HOST_NAME'] == 'customerstories.net'
      return 'production'
    elsif ENV['HOST_NAME'] == 'customerstories.org'
      return 'staging'
    else
      return 'development'
    end
  end

  # method only called if user_signed_in?
  def check_subdomain
    user_subdomain = current_user.company.try(:subdomain)
    if user_subdomain == request.subdomain  # all good
      true
    # zaps will be with subdomain in dev (cspdev) and without in production
    # account for both by sending the necessary parameter
    elsif params[:zapier_auth].present? || params[:zapier_trigger].present? || params[:zapier_create].present?
      true
    # no subdomain for the linkedin auth callback
    elsif params[:action] == 'linkedin_auth_callback'
      true
    elsif request.subdomain.blank? &&
          params[:controller] == 'site' &&
          (['index', 'store_front'].include?(params[:action]))
      # logged in, navigating to store front
      true
    elsif user_subdomain.nil?  # user not associated with a company
      if request.subdomain.blank?
        true
      else
        # ok to access public pages (story, stories index, or contributions)
        if (params[:controller] == 'stories' && (['index', 'show'].include? params[:action])) ||
            params[:controller] == 'contributions'
          true
        else # strip the subdomain, TODO: this should be a 401
          redirect_to url_for({ subdomain: nil,
                                controller: params[:controller],
                                action: params[:action] })
        end
      end
    else  # re-direction required
      if params[:action] == 'linkedin_callback'
         # linkedin_callback won't have subdomain, insert it and include params
        redirect_to url_for({ subdomain: user_subdomain,
                              controller: params[:controller],
                              action: params[:action],
                              params: request.params })
      else
        redirect_to url_for({ subdomain: user_subdomain,
                              controller: params[:controller],
                              action: params[:action] })
      end
    end
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up,
      keys: [:first_name, :last_name, :sign_up_code, :admin_access_code])
    devise_parameter_sanitizer.permit(:account_update) { |user|
      user.permit(:email, :first_name, :last_name, :photo_url, :linkedin_url, :title, :phone, :password, :password_confirmation, :current_password)
    }
  end

  # change devise redirect on sign in
  def after_sign_in_path_for resource
    if session[:user_return_to].present?
      session[:user_return_to]
    elsif resource.class.name == 'User'
      # binding.remote_pry
      if resource.company_id.present?  # returning users
        url_for({
            subdomain: resource.company.subdomain,
            controller: '/companies',
            action: 'show',
            id: resource.company.id,
        })
      else
        edit_profile_no_company_path
      end
    elsif resource.class.name == 'Admin'
      rails_admin_path
    end
  end

  # removes the subdomain from the url upon signing out
  def after_sign_out_path_for resource
    url_for({ subdomain: nil, controller: '/site', action: 'index' })
  end

  def invalid_subdomain?
    params[:controller] == 'site' && params[:action] == 'invalid_subdomain'
  end

  def set_s3_direct_post
    @s3_direct_post = S3_BUCKET.presigned_post(key: "uploads/#{SecureRandom.uuid}/${filename}", success_action_status: '201', acl: 'public-read')
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
          .order("CASE contributions.role
                    WHEN 'customer' THEN '1'
                    WHEN 'customer success' THEN '2'
                    WHEN 'sales' THEN '3'
                  END")
          .to_a
          .delete_if { |c| c.id == story.curator.id }
  end


  private

  def layout
    # if you want to skip the layout ...
    #   false
    # elsif you want to use a different layout
    #   "my_layout"
    # else
      "application"
    # end
  end

  def get_linkedin_token(code, callback)
    token_request = Typhoeus::Request.new(
      LINKEDIN_GETTOKEN_BASE_URL,
      method: 'POST',
      params: {
        grant_type: 'authorization_code',
        code: code,
        client_id: ENV['PIXLEE_LINKEDIN_KEY'],
        client_secret: ENV['PIXLEE_LINKEDIN_SECRET'],
        redirect_uri: callback
      }
    )
    token_request.run
    JSON.parse(token_request.response.response_body)
  end

end
