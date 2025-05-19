require_relative 'seed_data'

# Destroy existing data
acme = Company.find_by(subdomain: 'acme-test')
if acme
  # Detach curators to avoid foreign key issues (they will be reinstated below)
  acme.curators.update_all(company_id: nil)

  # Delete associated users to prevent orphaning
  (acme.contributors + acme.referrers).uniq.each do |user|
    is_curator = user.successes.any?
    customers = Customer.joins(:contributions).where('contributions.contributor_id = ? OR contributions.referrer_id = ?', user.id, user.id).distinct
    contributes_to_others = customers.any? { |customer| customer.company != acme}
    user.destroy unless (is_curator or contributes_to_others)
  end

  # Destroy the Acme company and its dependent data
  acme.destroy
end

# Create Acme company
acme = Company.new(
  name: 'Acme Test',
  subdomain: 'acme-test',
  website: 'https://example.com',
  header_color_1: '#FFFFFF',
  header_color_2: '#FF0000',
  primary_cta_background_color: '#FF0000',
  primary_cta_text_color: '#FFFFFF',
  adwords_short_headline: 'Acme Customer Stories'
)
acme.skip_callbacks = true    # Skip callbacks to avoid unnecessary processing during seed
acme.save!

# Associate curators
curators = User.where(email: ['rycwilson@gmail.com', 'acme-test@customerstories.net'])
curators.each { |curator| acme.curators << curator }

# Create story categories
story_categories = SeedData::CATEGORIES.map { |category| acme.story_categories.create!(category) }

# Create products
products = SeedData::PRODUCTS.map { |product| acme.products.create!(name: product[:name]) }

# Create invitation templates
customer_template = acme.invitation_templates.create!(SeedData::CUSTOMER_INVITATION_TEMPLATE)
customer_success_template = acme.invitation_templates.create!(SeedData::CUSTOMER_SUCCESS_INVITATION_TEMPLATE)
sales_template = acme.invitation_templates.create!(SeedData::SALES_INVITATION_TEMPLATE)

# Create contributor questions
SeedData::CONTRIBUTOR_QUESTIONS.each do |question_data|
  invitation_template = acme.invitation_templates.find_by(name: question_data[:role])
  invitation_template.contributor_questions << acme.contributor_questions.create!(question_data.except(:role))
end

# Create customers and their associated data
SeedData::CUSTOMERS.each do |customer_data|
  customer = acme.customers.create!(customer_data)
  assigned_roles = []

  # Create users for the customer
  users = 4.times.map do
    first_name = Faker::Name.unique.first_name
    last_name = Faker::Name.unique.last_name
    email = "#{first_name.downcase}@#{customer.name.downcase.gsub(/\s+/, '')}.com"
    user = User.new(first_name:, last_name:, email:, password: email, sign_up_code: 'csp_beta')
    user.skip_confirmation_notification!
    user.save!
    
    # Assign a random, distinct role to the user 
    if assigned_roles.length < SeedData::CONTRIBUTOR_ROLES.length
      role = (SeedData::CONTRIBUTOR_ROLES - assigned_roles).sample
      user.role = role
      assigned_roles << role
    end

    user
  end.shuffle

  # Create successes and associated data
  4.times do |i|
    success_data = nil
    success = nil

    loop do
      begin
        success_data = SeedData.generate_success_and_story customer
        success = customer.successes.create!(name: success_data[:success_name], curator_id: curators.sample.id)
        break

      # The seed data might return a duplicate success name
      rescue ActiveRecord::RecordInvalid => e
        puts "Creating a success failed: #{e.message}. Retrying..."
      end
    end
    
    # Associate story with 3 of the 4 successes
    if i < 3
      loop do
        begin
          story = success.build_story(
            title: success_data[:story_title],
            logo_published: i == 1 || i == 2,
            published: i == 2
          )

          # Changeover from [:logo_published, :preview_published, :published] attributes to :status_new in progress
          if story.published?
            story.is_published!
          elsif story.logo_published?
            story.listed!
          else
            story.draft!
          end
    
          # For the unpublished story, allow for a default narrative and empty results
          unless i == 0
            story.narrative = Array.new(rand(10..15)) { SeedData.lorem_paragraph_html }.join
            SeedData::RESULTS.sample(rand(2..4)).each do |result|
              story.results.build(description: result)
            end
          end
          
          story.save!
          break

        # The seed data might return a duplicate story title
        rescue ActiveRecord::RecordInvalid => e
          puts "Creating a story for success failed: #{e.message}. Retrying..."
        end
      end
    end

    # Add contributions to the success
    3.times do |j|
      contributor = users[j]
      has_referrer = j == 2
      referrer = has_referrer ? users.last : nil
      contribution = success.contributions.create!(contributor:, referrer:)
      
      template = case contributor.role
      when 'Customer'
        customer_template
      when 'Customer Success'
        customer_success_template
      when 'Sales'
        sales_template
      end
      contribution.update!(invitation_template: template) if template
    end

    # Associate success with a random story category and product
    product = acme.products.sample
    product_category_name = SeedData::PRODUCTS.find { |p| p[:name] == product.name }[:category]
    category = acme.story_categories.where(name: product_category_name)&.first || story_categories.sample
    success.story_categories << category
    success.products << product
  end
end