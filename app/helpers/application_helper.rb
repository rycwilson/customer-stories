module ApplicationHelper
  def s3_direct_post
    post = S3_BUCKET.presigned_post(
      key: "uploads/#{SecureRandom.uuid}/${filename}",
      success_action_status: '201',
      signature_expiration: 1.week.from_now # max expiration setting
    )
    { url: post.url, host: URI.parse(post.url).host, 'postData' => post.fields }
  end

  def page_title(controller, action, company: nil, story: nil)
    if controller == 'companies' && action =~ /show|edit/
      "Customer Stories: Account #{action == 'show' ? 'Dashboard' : 'Settings'}"
    elsif company.present? && story.present?
      "#{company.name} Customer Stories: #{story.title}"
    elsif company.present?
      "#{company.name} Customer Stories"
    else
      'Customer Stories'
    end
  end

  def custom_google_fonts(company)
    fonts = case company&.subdomain
            when 'pixlee'
              'Inter:wght@400;500;600;700'
            when 'varmour'
              'Montserrat:wght@400;500;600;700'
            else
              ''
            end
    return unless fonts.present?

    "<link href=\"https://fonts.googleapis.com/css2?family=#{fonts}&display=swap\" rel=\"stylesheet\">".html_safe
  end

  def custom_stylesheet?(company, layout)
    case layout
    when 'application'
      company&.subdomain.in? %w[pixlee varmour]
    when 'stories'
      company.subdomain.in? %w[pixlee centerforcustomerengagement compas trunity varmour]
    when 'plugins'
      company.subdomain.in? %w[pixlee trunity varmour]
    else
      false
    end
  end

  def production?
    ENV['HOST_NAME'] == 'customerstories.net'
  end

  # method determines if title 'Customer Stories' should be displayed as plural
  def stories?
    controller_name == 'companies' && action_name != 'new' or
      controller_name == 'stories' && action_name == 'index' or
      controller_name == 'profile' && current_user.company_id.present?
  end

  # def registered_user_without_company?
  #   user_signed_in? && current_user.company_id.blank?
  # end

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
    o > 125 ? 'light' : 'dark'
  end

  # Using HEREDOC: https://blog.saeloun.com/2020/04/08/heredoc-in-ruby-and-rails/
  def disabled_submit_button_html
    <<~HTML.squish
      <div class="btn__content">[content]</div>
      <div class="btn__dots">
        <i class="fa fa-fw fa-circle"></i>
        <i class="fa fa-fw fa-circle"></i>
        <i class="fa fa-fw fa-circle"></i>
      </div>
    HTML
  end
end
