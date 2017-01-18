class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Devise - whitelist User params
  before_action :configure_permitted_parameters, if: :devise_controller?

  before_action :check_subdomain,
                  if: Proc.new { user_signed_in? },
              unless: Proc.new { devise_controller? || invalid_subdomain? ||
                                 params[:controller] == 'widgets' }

  helper_method :company_curator?

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

  def set_gon company=nil
    is_curator = (user_signed_in? && (current_user.company_id == company.try(:id)))
    gon.push({
      company: company.present? ?
                  JSON.parse(company.to_json({ methods: :header_style })) : nil,
      current_user: user_signed_in? ? {
                      name: current_user.full_name,
                      email: current_user.email,
                      is_curator: is_curator } : nil,
      stories: company.present? ? company.all_stories_json : nil,
      env: csp_environment
    })
  end

  #  this method ensures signed in users can't jump to a subdomain they don't belong to
  def check_subdomain
    user_subdomain = current_user.company.try(:subdomain)
    if user_subdomain.nil?
      # user without a company may proceed so long as he doesn't insert
      # a legit subdomain that isn't his ...
      if request.subdomain.blank?
        true
      else
        # ok to access public pages (story, stories index, or contributions)
        if (params[:controller] == 'stories' && (['index', 'show'].include? params[:action])) ||
            params[:controller] == 'contributions'
          true
        else # strip the subdomain
          redirect_to url_for({ subdomain: nil,
                                controller: params[:controller],
                                action: params[:action] })
        end
      end
    elsif user_subdomain == request.subdomain  # all good
      true
    elsif request.subdomain.blank? &&
          params[:controller] == 'site' &&
          (['index', 'store_front'].include? params[:action])
      # logged in, navigating to store front
      true
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
    if resource.class.name == 'User'
      if resource.company_id.present?  # returning users
        url_for({
            subdomain: resource.company.subdomain,
            controller: '/companies',
            action: 'show',
            id: resource.company.id
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

  # these are used in the analytics controller and company controller
  def fill_daily_gaps visitors, start_date, end_date
    all_dates = []
    if visitors.empty?
      (end_date - start_date).to_i.times do |i|
        all_dates << [(start_date + i).strftime("%-m/%-d"), 0]
      end
      return all_dates
    end
    first_dates = []
    (Date.strptime(visitors[0][0], "%m/%d/%y") - start_date).to_i.times do |index|
      first_dates << [(start_date + index).strftime("%-m/%-d/%y"), 0]
    end
    # check for gaps in the middle of the list, but only if at least two are present
    if visitors.length >= 2
      all_dates = first_dates +
        visitors.each_cons(2).each_with_index.flat_map do |(prev_date, next_date), index|
          prev_datep = Date.strptime(prev_date[0], '%m/%d/%y')
          next_datep = Date.strptime(next_date[0], '%m/%d/%y')
          return_arr = [prev_date]
          delta = (next_datep - prev_datep).to_i
          if delta > 1
            (delta - 1).times do |i|
              return_arr.insert(1, [(next_datep - (i + 1)).strftime("%-m/%-d"), 0])
            end
          end
          if (index == visitors.length - 2)
            return_arr << next_date
          else
            return_arr
          end
        end
    else
      all_dates = first_dates + visitors
    end
    end_delta = (end_date - Date.strptime(all_dates.last[0], "%m/%d/%y")).to_i
    end_delta.times do
      all_dates << [(Date.strptime(all_dates.last[0], "%m/%d/%y") + 1).strftime("%-m/%-d/%y"), 0]
    end
    # get rid of the year
    all_dates.map { |date| [date[0].sub!(/\/\d+$/, ''), date[1]] }
  end

  def fill_weekly_gaps visitors, start_date, end_date
    first_weeks = []
    ((Date.strptime(visitors[0][0], "%m/%d/%y") -
        start_date.beginning_of_week).to_i / 7).times do |index|
      first_weeks << [(start_date.beginning_of_week + index*7).strftime("%-m/%-d/%y"), 0]
    end
    all_weeks = first_weeks +
      visitors.each_cons(2).each_with_index.flat_map do |(prev_week, next_week), index|
        prev_weekp = Date.strptime(prev_week[0], '%m/%d/%y')
        next_weekp = Date.strptime(next_week[0], '%m/%d/%y')
        return_arr = [prev_week]
        delta = (next_weekp - prev_weekp).to_i
        delta /= 7
        if delta > 1
          (delta - 1).times do |i|
            return_arr.insert(1, [(next_weekp - ((i + 1)*7)).strftime("%-m/%-d/%y"), 0])
          end
        end
        if (index == visitors.length - 2)
          return_arr << next_week
        else
          return_arr
        end
      end
    end_delta = (end_date.beginning_of_week -
                 Date.strptime(all_weeks.last[0], "%m/%d/%y")).to_i
    end_delta /=7
    end_delta.times do
      all_weeks << [(Date.strptime(all_weeks.last[0], "%m/%d/%y") + 1.week).strftime("%-m/%-d/%y"), 0]
    end
    # get rid of the year
    all_weeks.map { |week| [week[0].sub!(/\/\d+$/, ''), week[1]] }
  end

end
