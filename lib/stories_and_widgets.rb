
module StoriesAndWidgets

  def get_filters_from_query_or_widget (company, params, is_widget=false)
    return {} if params[:preview].present?
    unless is_widget
      query_params = Rack::Utils.parse_nested_query(request.query_string)
      return {} if query_params.blank? || query_params.length > 2
    end
    filters = {}
    category_tag = params.try(:[], :category) &&
                   StoryCategory.joins(:customers)
                                .where(
                                  slug: params[:category],
                                  customers: { company_id: company.id }
                                ).take
    product_tag = params.try(:[], :product) &&
                  Product.joins(:customers)
                         .where(
                            slug: params[:product],
                            customers: { company_id: company.id }
                          ).take
    filters['category'] = category_tag.id if category_tag.present?
    filters['product'] = product_tag.id if product_tag.present?
    filters
  end

end