module ApplicationHelper

  def s3_direct_post
    post = S3_BUCKET.presigned_post(
      key: "uploads/#{SecureRandom.uuid}/${filename}", 
      success_action_status: '201',
      signature_expiration: 1.week.from_now   # max expiration setting
    )
    { url: post.url, host: URI.parse(post.url).host, 'postData' => post.fields }
  end

  def page_title(controller, action, company: nil, story: nil)
    if controller == 'companies' && action =~ /show|edit/
      "Customer Stories: Account #{action == 'show' ? 'Dashboard' : 'Settings'}"
    elsif company.present? and story.present?
      "#{company.name} Customer Stories: #{story.title}"
    elsif company.present?
      "#{company.name} Customer Stories"
    else 
      'Customer Stories'
    end
  end

  def custom_google_fonts(company)
    return nil if company.blank? || !['stories', 'plugins', 'companies'].include?(controller_name)
    fonts = case company.subdomain
      when 'pixlee'
        'Inter:wght@400;500;600;700'
      when 'varmour'
        'Montserrat:wght@400;500;600;700'
      else
        ''
      end
    fonts.present? ? 
      "<link href=\"https://fonts.googleapis.com/css2?family=#{fonts}&display=swap\" rel=\"stylesheet\">".html_safe : 
      nil
  end

  def custom_stylesheet?(company, layout)
    case layout
    when 'application'
      %w(pixlee varmour).include?(company.subdomain)
    when 'stories'
      %w(pixlee centerforcustomerengagement compas trunity varmour).include?(company.subdomain)
    when 'plugins'
      %w(pixlee trunity varmour).include?(company.subdomain)
    else
      false
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

  def curator?(company)
    company.present? && user_signed_in? && (current_user.company_id == company.id)
  end

  # def registered_user_without_company?
  #   user_signed_in? && current_user.company_id.blank?
  # end

  # method takes a url and strips out the subdomain (as defined by the current request)
  def strip_subdomain url
    if request.subdomain.present?
      url.sub(request.subdomain + '.', '')
    else
      url
    end
  end

  # http://www.w3.org/TR/AERT#color-contrast
  def color_shade(hex_color)
    # make sure it's a six-character hex value (not counting #)
    if hex_color.length < 7
      loop do
        hex_color << hex_color.last
        break if hex_color.length == 7
      end
    end
    rgb = { r: hex_color[1..2].hex, g: hex_color[3..4].hex, b: hex_color[5..6].hex }
    o = (((rgb[:r] * 299) + (rgb[:g] * 587) + (rgb[:b] * 114)) / 1000).round
    return (o > 125) ? 'light' : 'dark';
  end

end
