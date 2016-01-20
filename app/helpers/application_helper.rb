module ApplicationHelper

  # extra parameter is necessary because user not connected to customer (yet)
  def user_search user, customer
    search_user = User.find_by(id: user.id)
    search_user.first_name + "+" + search_user.last_name + "+" + customer.name
  end

end
