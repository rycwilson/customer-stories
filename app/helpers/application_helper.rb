module ApplicationHelper

  def admin_navbar? controller
    ['companies', 'stories', 'profile'].include?(controller)
  end

  def include_gon? controller, action
    controller == 'site' && ['index', 'store_front'].include?(action) ||
    controller == 'stories' && ['index', 'show', 'edit'].include?(action) ||
    controller == 'companies' && ['show', 'edit'].include?(action) ||
    controller == 'profile' && action == 'edit'
  end

  def company_widget_color company
    case company.subdomain
    when 'trunity'
      '#FEBE57'
    when 'compas'
      '#e55f53'
    when 'varmour'
      '#60ccf3'
    when 'centerforcustomerengagement'
      '#007fc5'
    when 'zeniq'
      '#364150'
    when 'corefact'
      '#1f9421'
    when 'saucelabs'
      '#e2231a'
    when 'juniper'
      '#3493c1'
    when 'neonova'
      '#669bb2'
    when 'kodacon'
      '#85cee6'
    when 'zoommarketing'
      '#9e61a8'
    when 'modeanalytics'
      '#37b067'
    when 'acme-test'
      '#ff0000'
    else
      'rgb(14, 122, 254)'
    end
  end

  def include_gtm? company=nil, current_user=nil, controller, action
    ENV['HOST_NAME'] == 'customerstories.net' &&
    controller == 'stories' &&
    (['index', 'show'].include? action) &&
    company.try(:gtm_id).present? && !user_signed_in?
  end

  def mvp_stylesheet
    if ['companies', 'stories', 'profile', 'contributions'].include?(controller_name)
      stylesheet_link_tag('mvpready-admin', media: 'all', 'data-turbolinks-track' => 'reload')
    else
      stylesheet_link_tag('mvpready-landing', media: 'all', 'data-turbolinks-track' => 'reload')
    end
  end

  def production?
    ENV['HOST_NAME'] == 'customerstories.net'
  end

  def staging?
    ENV['HOST_NAME'] == 'customerstories.org'
  end

  # method determines if title 'Customer Stories' should be displayed as plural
  def stories?
    (controller_name == 'companies' && action_name != 'new') ||
    (controller_name == 'stories' && action_name == 'index') ||
    (controller_name == 'profile' && current_user.company_id.present?)
  end

  def curator?(company_id)
    user_signed_in? && (current_user.company_id == company_id)
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
