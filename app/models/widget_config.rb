class WidgetConfig < ActiveRecord::Base

  belongs_to :company

  def header_style tab_size, is_csp
    case tab_size
    when 'small'
      width = is_csp ? '140px' : '170px'
      height = line_height = '24px'
      font_size = '16px'
    when 'large'
      width = is_csp ? '206px' : '254px'
      height = line_height = '36px'
      font_size = '24px'
    else
    end
    "background-color:#{self.tab_color};color:#{self.text_color};height:#{height};width:#{width};line-height:#{line_height};font-size:#{font_size};"
  end

end
