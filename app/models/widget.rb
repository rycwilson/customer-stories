class Widget < ActiveRecord::Base

  belongs_to :company

  def tab_style options={}
    tab_color = options[:tab_color] || self.tab_color
    text_color = options[:text_color] || self.text_color
    "background-color:#{tab_color};color:#{text_color};"
  end

end
