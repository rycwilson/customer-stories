
module StoriesAndWidgets

  def get_filters_from_query_or_widget (company, params)
    filters = {}
    query_hash = Rack::Utils.parse_nested_query(request.query_string)
    return nil if request.query_string.blank? ||
                  request.query_string.length > 2 ||
                  params[:preview].present?
    category_tag = params.try(:[], :category) &&
                   StoryCategory.joins(:customers)
                                .where(
                                  slug: params[:category],
                                  customers: { company_id: company.id }
                                )
    product_tag = params.try(:[], :product) &&
                  Product.joins(:customers)
                         .where(
                            slug: params[:product],
                            customers: { company_id: company.id }
                          )
    filters['category'] = category_tag.id if category_tag.present?
    filters['product'] = product_tag.id if product_tag.present?
    filters.present? ? filters : nil
  end

end