module SuccessesAndContributions

  # zaps may have a full name in the first_name field;
  # for multiple words, treat the last one as last name and all others as first name
  def check_name_format (user_params)
    if user_params[:first_name].split(' ').length > 1
      user_params[:first_name] = user_params[:first_name]
                                    .split(' ')
                                    .slice(0, user_params[:first_name].split(' ').length - 1)
                                    .join(' ')
      user_params[:last_name] = user_params.split(' ').pop
    else
      user_params[:last_name] = 'not provided'
    end
  end

  def find_dup_customer (customer_params, is_zap, current_user)
    if is_zap || !is_zap  # works for either
      if (customer = Customer.where(name: customer_params.try(:[], :name), company_id: current_user.company_id).take)
        customer_params[:id] = customer.id
        customer_params.delete_if { |k, v| k != 'id' }
      else
        customer_params[:company_id] = current_user.company_id
      end
    else
    end
  end

  def find_dup_users_and_check_name_format (referrer_params, contributor_params, is_zap)
    if is_zap || !is_zap  # works for either
      if (referrer = User.find_by_email(referrer_params.try(:[], :email)))
        referrer_params[:id] = referrer.id
        # allow certain attribute updates
        referrer_params.delete_if { |k, v| !['id', 'title', 'phone'].include?(k) }
      end
      check_name_format(referrer_params) if is_zap && referrer_params[:last_name].blank?
      if (contributor = User.find_by_email(contributor_params.try(:[], :email)))
        contributor_params[:id] = contributor.id
        contributor_params.delete_if { |k, v| !['id', 'title', 'phone'].include?(k) }
      end
      check_name_format(contributor_params) if is_zap && contributor_params[:last_name].blank?
    end

  end

end