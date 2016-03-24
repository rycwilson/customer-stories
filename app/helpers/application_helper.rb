module ApplicationHelper

  def admin_navbar_style
    company = @company || Company.find_by(name:'CSP')
    color1 = company.nav_color_1
    color2 = company.nav_color_2
    text_color = company.nav_text_color
    "background:linear-gradient(45deg, #{color1} 0%, #{color2} 100%);color:#{text_color};"
  end

end
