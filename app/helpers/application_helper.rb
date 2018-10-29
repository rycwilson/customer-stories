module ApplicationHelper

  def custom_google_fonts(company)
    return nil if company.blank? || controller_name != 'stories'
    fonts = case company.subdomain
      when 'pixlee'
        'Muli:400,600,700|Bowlby+One+SC'
      else
        ''
      end
    fonts.present? ? "<link href='https://fonts.googleapis.com/css?family=#{fonts}' rel='stylesheet'>".html_safe : nil
  end

  def admin_navbar? controller
    ['companies', 'stories', 'profile'].include?(controller)
  end

  def fixed_navbar? (company, controller, action)
    company.present? &&
    company.subdomain == 'compas' &&
    controller == 'stories' &&
    (action == 'index' || action == 'show')
  end

  def include_gon? controller, action
    controller == 'site' && ['index', 'store_front'].include?(action) ||
    controller == 'stories' && ['index', 'show', 'edit'].include?(action) ||
    controller == 'companies' && ['show', 'edit'].include?(action) ||
    controller == 'profile' && action == 'edit'
  end

  def production?
    ENV['HOST_NAME'] == 'customerstories.net'
  end

  def staging?
    ENV['HOST_NAME'] == 'customerstories.org'
  end

  def mvp_stylesheet
    if ['companies', 'stories', 'profile', 'contributions'].include?(controller_name)
      stylesheet_link_tag('mvpready-admin', media: 'all', 'data-turbolinks-track' => 'reload')
    else
      stylesheet_link_tag('mvpready-landing', media: 'all', 'data-turbolinks-track' => 'reload')
    end
  end

  # method determines if title 'Customer Stories' should be displayed as plural
  def stories?
    (controller_name == 'companies' && action_name != 'new') ||
    (controller_name == 'stories' && action_name == 'index') ||
    (controller_name == 'profile' && current_user.company_id.present?)
  end

  def curator?(company)
    company.present? && user_signed_in? && (current_user.company_id == company.id)
  end

  def registered_user_without_company?
    user_signed_in? && current_user.company_id.blank?
  end

  # method takes a url and strips out the subdomain (as defined by the current request)
  def strip_subdomain url
    if request.subdomain.present?
      url.sub(request.subdomain + '.', '')
    else
      url
    end
  end

  def title_helper controller, action, company=nil, story=nil
    if controller == 'stories' && action == 'show'
      story.title
    elsif controller == 'stories' && action == 'index'
      company.name + ' Customer Stories'
    else
      'Customer Stories'
    end
  end

end
