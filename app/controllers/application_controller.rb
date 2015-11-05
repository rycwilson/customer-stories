class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Devise - whitelist User params
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.for(:sign_up) << :first_name
    devise_parameter_sanitizer.for(:account_update) << :first_name
    devise_parameter_sanitizer.for(:sign_up) << :last_name
    devise_parameter_sanitizer.for(:account_update) << :last_name
    devise_parameter_sanitizer.for(:sign_up) << :sign_up_code
  end

  # change devise redirect on sign in
  def after_sign_in_path_for(user)
    return company_path(user.company_id) if user.company_id
    new_company_path
  end

  #
  # Below: methods used by companies and stories controllers to
  # populate select2 boxes for story tagging...
  #
  def customers_select_options company_customers
    @customers_select = company_customers.map do |customer|
      # name will appear as a selection, while its id will be the value submitted
      [ customer.name, customer.id ]
    end
    .unshift( [""] )  # empty option makes placeholder possible (only needed for single select)
    # if sending the options to javascript use .to_json:
    # .to_json
  end

  # company-specific categories (if any) listed first,
  # followed by generic categories
  def industries_select_options company_industries
    @industries_select = company_industries.map do |industry|
      [ industry.name, industry.id ]
    end
    .concat(
      INDUSTRIES.map do |category|
        # value = the category itself (pass this through so a company
        # category can be created based on the generic category)
        [ category, category ]
      end
    )
    .uniq { |industry| industry[0] }  # get rid of duplicates
  end

  def product_cats_select_options company_product_cats
    @product_cats_select = company_product_cats.map do |category|
      [ category.name, category.id ]
    end
  end

  def products_select_options company_products
    @products_select = company_products.map do |product|
      [ product.name, product.id ]
    end
  end

end
