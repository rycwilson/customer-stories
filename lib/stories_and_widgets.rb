
module StoriesAndWidgets

  def get_filters_from_query_or_widget (company, params)
    filters = {}
    query_params = Rack::Utils.parse_nested_query(request.query_string)
    # TODO This won't work for the widget!
    return nil if query_params.blank? || query_params.length > 2 || params[:preview].present?
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
    filters.present? ? filters : nil
  end

end