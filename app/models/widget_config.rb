class WidgetConfig < ActiveRecord::Base

  belongs_to :company

  def tab_style options, is_csp
    tab_color = options[:tab_color] || self.tab_color
    text_color = options[:text_color] || self.text_color
    if options[:tab_size] == 'small' || self.tab_size == 'small'
      width = is_csp ? '140px' : '192px'  # different widths for different text content
      height = line_height = '24px'
      font_size = '16px'
    elsif options[:tab_size] == 'large' || self.tab_size == 'large'
      width = is_csp ? '206px' : '286px'
      height = line_height = '36px'
      font_size = '24px'
    end
    "background-color:#{tab_color};color:#{text_color};height:#{height};width:#{width};line-height:#{line_height};font-size:#{font_size};"
  end

end
