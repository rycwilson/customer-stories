# frozen_string_literal: true

module SchemaConformable
  def find_dup_customer(params, company)
    new_customer_attrs = params[:customer_attributes] ||
                         params.dig(:success_attributes, :customer_attributes)
    return params unless new_customer_attrs.present?

    existing_customer = company.customers.find_by(name: new_customer_attrs[:name])
    if existing_customer
      if params[:customer_attributes].present?
        params[:customer_id] = existing_customer.id
        params.delete(:customer_attributes)
      elsif params.dig(:success_attributes, :customer_attributes).present?
        params[:success_attributes][:customer_id] = existing_customer.id
        params[:success_attributes].delete(:customer_attributes)
      end
    end
    params
  end

  def find_dup_user(new_user_attrs)
    if (user = User.find_by_email(new_user_attrs.try(:email)))
      new_user_attrs[:id] = user.id

      # Allow title and phone fields to be updated on existing users
      new_user_attrs.select! { |attr, _| attr.in? %w[id title phone] }
    else
      return {} unless new_user_attrs[:email].present? && new_user_attrs[:first_name].present?

      new_user_attrs = split_names(new_user_attrs) if new_user_attrs[:last_name].blank?
      new_user_attrs
    end
  end

  private

  # Zaps may have a full name in the first_name field
  # Pop the last token from the first name and make it the last name if last name is blank
  def split_names(new_user_attrs)
    return new_user_attrs unless new_user_attrs[:last_name].blank?

    match = new_user_attrs[:first_name].match(/(?<first>.+)\s+(?<last>\S+\z)/)
    new_user_attrs[:first_name] = match[:first] if match[:first]
    new_user_attrs[:last_name] = match[:last] if match[:last]
    new_user_attrs
  end
end
