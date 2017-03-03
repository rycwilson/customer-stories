class WidgetConfig < ActiveRecord::Base

  belongs_to :company

  def tab_style options, is_csp
    tab_color = options[:tab_color] || self.tab_color
    text_color = options[:text_color] || self.text_color
    case options[:tab_size]
    when 'small'
      width = is_csp ? '140px' : '170px'  # different widths for different text content
      height = line_height = '24px'
      font_size = '16px'
    when 'large'
      width = is_csp ? '206px' : '254px'
      height = line_height = '36px'
      font_size = '24px'
    else  # default small
      width = is_csp ? '140px' : '170px'
      height = line_height = '24px'
      font_size = '16px'
    end
    "background-color:#{tab_color};color:#{text_color};height:#{height};width:#{width};line-height:#{line_height};font-size:#{font_size};"
  end

end
