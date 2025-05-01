# Destroy existing data
acme = Company.find_by(subdomain: 'acme-test')
if acme
  # Destroy associated data to avoid orphaning
  User.joins(:contributions).where(contributions: { success: { company_id: acme.id } }).destroy_all
  acme.destroy
end

# Create Acme company
acme = Company.create!(name: 'Acme Test', subdomain: 'acme-test', website: 'https://example.com')

# Associate curators
curators = User.where(email: ['rycwilson@gmail.com', 'acme-test@customerstories.net'])
curators.each { |curator| acme.curators << curator }

# Create story categories
story_categories = SeedData::CATEGORIES.map { |category| acme.story_categories.create!(category) }

# Create products
products = SeedData::PRODUCTS.map { |product| acme.products.create!(name: product[:name]) }

# Create customers and their associated data
SeedData::CUSTOMERS.each do |customer_data|
  customer = acme.customers.create!(name: customer_data[:name])

  # Create users for the customer
  users = 4.times.map do
    first_name = Faker::Name.unique.first_name
    last_name = Faker::Name.unique.last_name
    customer.users.create!(
      first_name: first_name,
      last_name: last_name,
      email: "#{first_name.downcase}@#{customer.name.downcase.gsub(/\s+/, '')}.com"
    )
  end

  # Create successes and associated data
  4.times do |i|
    success_data = SeedData.generate_success_and_story
    success = customer.successes.create!(name: success_data[:success_name])

    # Associate story with 3 of the 4 successes
    if i < 3
      story = success.create_story!(title: success_data[:story_title],
                                    logo_published: i == 1 || i == 2,
                                    published: i == 2)

      # Add results to the story
      SeedData::RESULTS.sample(rand(2..3)).each do |result|
        story.results.create!(description: result)
      end
    end

    # Add contributions to the success
    3.times do |j|
      contributor = users[j]
      referrer = j == 2 ? users.last : nil
      success.contributions.create!(contributor: contributor, referrer: referrer)
    end

    # Associate success with a random story category and product
    success.update!(story_category: story_categories.sample, product: products.sample)
  end
end

# Create invitation templates
acme.invitation_templates.create!(SeedData::CUSTOMER_INVITATION_TEMPLATE)
acme.invitation_templates.create!(SeedData::CUSTOMER_SUCCESS_INVITATION_TEMPLATE)
acme.invitation_templates.create!(SeedData::SALES_INVITATION_TEMPLATE)