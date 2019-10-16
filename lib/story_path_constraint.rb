class StoryPathConstraint

  def self.matches? request
    company = Company.find_by(subdomain: request.subdomain)
    customer = Customer.friendly.exists?(request.params[:customer]) ?
                 Customer.friendly.find(request.params[:customer]) : 
                 nil
    story = Story.friendly.exists?(request.params[:title]) ?
              Story.friendly.find(request.params[:title]) :
              request.params[:hidden_link] && Story.exists?(hidden_link: request.url) ?
                Story.find_by(hidden_link: request.url) : 
                nil
    if customer && story && request.params[:product]
      product = Product.friendly.exists?(request.params[:product]) ?
        Product.friendly.find(request.params[:product]) : nil
      product && Story.joins(success: { customer: {}, products: {} })
                      .where(customers: { name: customer.name, company_id: company.id },
                              products: { name: product.name, company_id: company.id },
                                  slug: story.slug)
                      .present?
    elsif customer && story
      Story.joins(success: { customer: {} })
           .where(
              customers: { name: customer.name, company_id: company.id },
              slug: story.slug
            )
           .present?
    else
      false
    end
  end

end
