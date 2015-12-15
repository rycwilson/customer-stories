module ApplicationHelper

  def header (text)
    content_for(:header) { text.to_s }
  end

  def user_full_name user
    user.first_name + " " + user.last_name
  end

  def user_company user
    Company.find_by(id: user.company_id).name
  end

end
