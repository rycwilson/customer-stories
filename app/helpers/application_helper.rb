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

  # extra parameter is necessary because user not connected to customer (yet)
  def user_search user, customer
    search_user = User.find_by(id: user.id)
    search_user.first_name + "+" + search_user.last_name + "+" + customer.name
  end

end
