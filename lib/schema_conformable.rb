module SchemaConformable

  # zaps may have a full name in the first_name field;
  # for multiple words, treat the last one as last name and all others as first name
  def split_full_name (user_params)
    user_params[:last_name] = user_params[:first_name].split(' ').pop
    user_params[:first_name] = user_params[:first_name]
                                  .split(' ')
                                  .slice(0, user_params[:first_name].split(' ').length - 1)
                                  .join(' ')
    user_params
  end

  def find_dup_customer(params, company)
    customer_attrs = params[:customer_attributes] ||
                     params.dig(:success_attributes, :customer_attributes)
    return unless customer_attrs.present?

    existing_customer = company.customers.find_by(name: customer_attrs[:name])
    if existing_customer
      params[:customer_id] = existing_customer.id
      params.delete(:customer_attributes)
    end
    params
  end

  def find_dup_user_and_split_full_name (user_params, is_zap)
    return {} if (user_params.blank? || user_params[:email].blank?)
    if is_zap || !is_zap  # works for either
      if (user = User.find_by_email(user_params.try(:[], :email)))
        user_params[:id] = user.id
        user_params.delete_if { |k, v| !['id', 'title', 'phone'].include?(k) }
      else
        return {} if user_params[:first_name].blank?  # at minimum, need first name data
        user_params = split_full_name(user_params) if (is_zap && user_params[:first_name].split(' ').length > 1 && user_params[:last_name].blank?)
        user_params
      end
    end
  end

end