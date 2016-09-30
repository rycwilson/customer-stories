class ProfileController < ApplicationController

  before_action { @user = current_user; @company = @user.try(:company) }
    # note company may be nil (contributor on site, or contrbution submission)
  before_action only: [:edit] { set_gon(@company) }
  before_action :linkedin_authenticated?, only: :linkedin_callback
  before_action :set_linkedin_callback, only: [:linkedin_callback, :linkedin_connect]
  before_action :set_s3_direct_post, only: [:linkedin_callback, :edit]

  def linkedin_callback

    if user_signed_in?  # curator or contributor
      if params[:error]
        redirect_to edit_profile_path,
                    flash: { warning: params[:error_description] }
      elsif params[:code] # code returned, now get access token
        token_response = get_linkedin_token(params[:code], @linkedin_callback)
        if token_response['error']
          redirect_to edit_profile_path,
              flash: { danger: 'LinkedIn error: ' + token_response['error_description'] }
        else
          token = token_response['access_token']
          # save token to User model
          linkedin_data = get_linkedin_data(token)
          logger.info linkedin_data
          if false # errors
            # what if linkedin api is down?  timeout?
            # since this is all happening in the same flow, a 401 response won't happen;
            # but further authenticated requests (from linkedin_connect action)
            # need to account for possibility of 401, re-direct to beginning of auth process
          else
            if update_user_linkedin_data(@user, linkedin_data)
              redirect_to edit_profile_path, flash: { info: 'Connected to LinkedIn'}
            else
              redirect_to edit_profile_path,
                          flash: { danger: @user.errors.full_messages.join(', ') }
            end
          end
        end
      else
        # error
      end
    else  # contribution submission
      contribution =
        Contribution.find_by(id: params[:state].match(/csp(\d+)$/).try(:[],1))
      contributor = contribution.contributor
      # if contribution.nil?
      # Not likely. If we're here it means contribution was succesfully submitted,
      # also linkedin_authenticated? confirms presence of contribution id
      company = contribution.success.customer.company
      if request.subdomain.empty?  # insert subdomain and re-direct
        redirect_to url_for({
                      subdomain: company.subdomain,
                      params: request.params
                    }) and return
      end
      if params[:error]
        redirect_to confirm_contribution_path(contribution),
                    flash: { warning: params[:error_description] }
      elsif params[:code]
        token_response = get_linkedin_token(params[:code], @linkedin_callback)
        if token_response['error']
          redirect_to confirm_contribution_path(contribution),
                      flash: { danger: 'LinkedIn error: ' + token_response['error_description'] }
        else
          token = token_response['access_token']
          # save token to User model
          linkedin_data = get_linkedin_data(token)
          # not checking for errors here,
          # what's the point of telling contributor?
          if update_user_linkedin_data(contributor, linkedin_data)
            redirect_to confirm_contribution_path(contribution)
          else
            redirect_to confirm_contribution_path(contribution),
                flash: {
                  warning: "Submission successful, but errors saving LinkedIn data: #{contributor.errors.full_messages.join(', ')}"
                }
          end
        end
      else
        redirect_to linkedin_connect_path
      end
    end
  end

      # always want to update the linkedin_url field,
      # but the others only update conditionally (i.e. only if nil)
      # current_user.linkedin_url = auth_hash[:info][:urls][:public_profile]
      # current_user.phone ||= auth_hash[:info][:phone]
      # current_user.title ||= auth_hash[:info][:description]
      # logger.debug "#{JSON.pretty_generate(auth_hash)}"
      # if current_user.save
      #   # TODO: log the auth_hash
      #   if current_user.company_id.present?
      #     flash[:success] = 'Account setup complete'
      #     redirect_to company_path(current_user.company_id)
      #   else
      #     flash[:info] = 'Connected to LinkedIn'
      #     redirect_to edit_profile_no_company_path
      #   end
      # else
      #   # flash.now[:danger] = "Problem updating linkedin_url field for #{}"
      # end

  def linkedin_connect
    if params[:contribution_id]  # request coming from contribution submission
      # append the contribution id to the state param
      # (adding a separate param will cause a failure with linkedin,
      #  won't match registered callback urls)
      linkedin_authorize_base_url =
        LINKEDIN_AUTHORIZE_BASE_URL.sub(/state=\w+/, '\0csp' + params[:contribution_id])
      redirect_to linkedin_authorize_base_url + @linkedin_callback
    else  # signed in user
      # if user already has a token, go ahead and request the data, else ...
      redirect_to LINKEDIN_AUTHORIZE_BASE_URL + @linkedin_callback
    end
  end

  def edit
  end

  def update
  end

  def destroy
  end

  private

  def set_linkedin_callback
    callback = url_for({ subdomain: nil,
                         controller: 'profile',
                         action: 'linkedin_callback' })
    if params[:action] == 'linkedin_connect'
      # here we need to include 'redirect_uri='
      @linkedin_callback = { redirect_uri: callback }.to_param
    elsif params[:action] == 'linkedin_callback'
      # here we don't
      @linkedin_callback = callback
    end
  end

  def get_linkedin_token code, callback
    token_request = Typhoeus::Request.new(
      LINKEDIN_GETTOKEN_BASE_URL,
      method: :post,
      params: { grant_type: 'authorization_code',
                code: code,
                client_id: ENV['LINKEDIN_KEY'],
                client_secret: ENV['LINKEDIN_SECRET'],
                redirect_uri: callback }
    )
    token_request.run
    JSON.parse(token_request.response.response_body)
  end

  def get_linkedin_data token
    data_request = Typhoeus::Request.new(
      LINKEDIN_PEOPLE_BASE_URL +
        ":(location:(name),\
           positions,\
           public-profile-url,\
           picture-urls::(original))".gsub(/\s+/, ''),
      method: :get,
      params: { format: 'json' },
      headers: { Authorization: "Bearer #{token}" }
    )
    data_request.run
    JSON.parse(data_request.response.response_body)
  end

  def update_user_linkedin_data user, linkedin_data
    user.update({
          linkedin_url: linkedin_data['publicProfileUrl'],
          linkedin_photo_url: linkedin_data['pictureUrls']['values'][0],
          linkedin_company: linkedin_data['positions']['values'][0]['company']['name'],
          linkedin_title: linkedin_data['positions']['values'][0]['title'],
          linkedin_location: linkedin_data['location']['name']
        })
  end

  def linkedin_authenticated?
    if params[:state] == ENV['LINKEDIN_STATE'] ||
      # if contribution submission, state param tagged with contribution
      ( params[:state].match(/csp(\d+)$/) &&
        params[:state].sub(/csp\d+/, '' ) == ENV['LINKEDIN_STATE'] )
      true
    else
      render file: 'public/401', status: 401, layout: false
      false
    end
  end

end
