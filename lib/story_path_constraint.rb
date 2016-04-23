class StoryPathConstraint

  def self.matches? request
    company = Company.find_by subdomain: request.subdomain
    customer = Customer.friendly.find request.params[:customer]
    story = Story.friendly.find request.params[:title]

    if customer && story && request.params[:product]
      product = Product.friendly.find request.params[:product]
      product && Story.joins(success: { customer: {}, products: {} })
                      .where(customers: { name: customer.name, company_id: company.id },
                              products: { name: product.name, company_id: company.id },
                                  slug: story.slug)
                      .present?
    elsif customer && story
      Story.joins(success: { customer: {} })
           .where(customers: { name: customer.name, company_id: company.id },
                       slug: story.slug)
           .present?
    else
      false
    end
  end

end
