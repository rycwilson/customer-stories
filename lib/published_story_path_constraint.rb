class PublishedStoryPathConstraint
  def self.matches? request
    company = Company.find_by subdomain: request.subdomain
    
    # Just check the story
    # if request.params[:title].present?
    #   story = company.stories.friendly.find request.params[:title]
    # else
    #   story = company.stories.find_by hidden_link: request.params[:hidden_link]
    # end
    # story&.published?

    # Check all url segments
    if request.params[:random_string].present?
      company.stories.exists? hidden_link: request.params[:random_string]
    else 
      customer = company.customers&.friendly.find request.params[:customer] rescue nil
      story = customer&.stories&.friendly.find request.params[:title] rescue nil
      product = company.products&.friendly.find(request.params[:product]) rescue nil
      if customer and story&.published?
        product ? story.product_tags.include?(product) : request.params[:product].nil?
      else 
        false
      end
    end
  end
end
