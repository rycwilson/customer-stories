
# This file assumes the existence of:
#
#   users: 'dlindblom@gmail.com', '***REMOVED***'
#   companies: 'Cisco', 'CSP'
#
#  ** All other data will be destroyed and re-created upon running this file **

require File.expand_path('../seeds/demo_customers', __FILE__)
require File.expand_path('../seeds/contributions', __FILE__)
require File.expand_path('../seeds/stories', __FILE__)
require File.expand_path('../seeds/visitors', __FILE__)
require File.expand_path('../seeds/email_templates', __FILE__)

# ref: http://stackoverflow.com/questions/619840/
# require "#{Rails.root}/db/seeds/contributions.rb"

# see config/initializers/constants.rb for generic list of industries
INDUSTRIES_CISCO = ['Automotive', 'Education', 'Energy', 'Financial Services', 'Government', 'Healthcare', 'Hospitality', 'Life Sciences', 'Manufacturing', 'Retail', 'Sports and Entertainment', 'Transportation']
PROD_CATS = ['Servers', 'Switches', 'Routers', 'Networking Software', 'Security', 'Storage', 'Video']
PRODUCTS = ['UCS C3160', 'Nexus 7004', 'Catalyst 6807', 'ISR 4400', 'ASR 1001', 'IOS XR 5.1', 'AnyConnect 4.1', 'MDS 9500']

ROLES = ['customer', 'partner', 'sales']
STATUS_OPTIONS = ['pre_request', 'request', 'remind1', 'remind2', 'feedback', 'contribution', 'opt_out', 'unsubscribe', 'did_not_respond']

dan = User.create(first_name:'Dan', last_name:'Lindblom', email:'***REMOVED***', linkedin_url:'https://www.linkedin.com/in/danlindblom', sign_up_code:'csp_beta', password:'password')
ryan = User.create(first_name:'Ryan', last_name:'Wilson', email:'***REMOVED***', linkedin_url:'https://www.linkedin.com/in/wilsonryanc', sign_up_code:'csp_beta', password:'password')
curators = [dan, ryan]
# cisco = Company.find_by(name:'Cisco Systems')
cisco = Company.create(name:'Cisco Systems', subdomain:'cisco')
cisco.users << dan << ryan

# csp = Company.find_by(name:'CSP')
csp = Company.create(name:'CSP', subdomain:'csp')

# destroy contributions first so deleted users don't orphan contributions (violates foreign key costraint)
# Note: not using (dependent: :destroy) for users -> contributions (or users -> successes)
# Contribution.destroy_all
# Customer.destroy_all # also destroys successes, stories, visitors, and successes* join tables
# User.where.not("email = ? OR email = ?", "***REMOVED***", "***REMOVED***").destroy_all
# Product.destroy_all
# ProductCategory.destroy_all
# IndustryCategory.destroy_all
# EmailTemplate.destroy_all

# some users with linkedin profiles
user1 = User.create(first_name:'Carlos', last_name:'Ramon', email:'carlos@mail.com', linkedin_url:'https://www.linkedin.com/in/carlosramon', sign_up_code:'csp_beta', password:'password')
user2 = User.create(first_name:'Reza', last_name:'Raji', email:'reza@mail.com', linkedin_url:'https://www.linkedin.com/in/rezaraji', sign_up_code:'csp_beta', password:'password')
user3 = User.create(first_name:'Jeff', last_name:'Haslem', email:'jeffh@mail.com', linkedin_url:'https://www.linkedin.com/in/jeffhaslem', sign_up_code:'csp_beta', password:'password')
user4 = User.create(first_name:'Allan', last_name:'Lo', email:'allan@mail.com', linkedin_url:'https://www.linkedin.com/pub/allan-lo/2/80/214', sign_up_code:'csp_beta', password:'password')
user5 = User.create(first_name:'Jeff', last_name:'Weiner', email:'jeffw@mail.com', linkedin_url:'https://www.linkedin.com/in/jeffweiner08', sign_up_code:'csp_beta', password:'password')

# Cisco's target industries...
INDUSTRIES_CISCO.each do |industry_name|
  cisco.industry_categories << IndustryCategory.create(name: industry_name)
end

# # Cisco's product categories and products...
PROD_CATS.each do |category_name|
  cisco.product_categories << ProductCategory.create(name: category_name)
end
PRODUCTS.each do |product_name|
  cisco.products << Product.create(name: product_name)
end

# Default email templates
csp.email_templates << EmailTemplate.create(name: "Customer - initial contribution request", subject: EmailTemplatesSeed::REQUEST_SUBJECT, body: EmailTemplatesSeed::CUSTOMER_REQUEST_BODY)
csp.email_templates << EmailTemplate.create(name: "Customer - first contribution reminder", subject: EmailTemplatesSeed::CUSTOMER_REMIND1_SUBJECT, body: EmailTemplatesSeed::CUSTOMER_REMIND1_BODY)
csp.email_templates << EmailTemplate.create(name: "Customer - second contribution reminder", subject: EmailTemplatesSeed::CUSTOMER_REMIND2_SUBJECT, body: EmailTemplatesSeed::CUSTOMER_REMIND2_BODY)
csp.email_templates << EmailTemplate.create(name: "Partner - initial contribution request", subject: EmailTemplatesSeed::REQUEST_SUBJECT, body: EmailTemplatesSeed::PARTNER_REQUEST_BODY)
csp.email_templates << EmailTemplate.create(name: "Partner - first contribution reminder", subject: EmailTemplatesSeed::PARTNER_REMIND1_SUBJECT, body: EmailTemplatesSeed::PARTNER_REMIND1_BODY)
csp.email_templates << EmailTemplate.create(name: "Partner - second contribution reminder", subject: EmailTemplatesSeed::PARTNER_REMIND2_SUBJECT, body: EmailTemplatesSeed::PARTNER_REMIND2_BODY)
csp.email_templates << EmailTemplate.create(name: "Sales - initial contribution request", subject: EmailTemplatesSeed::REQUEST_SUBJECT, body: EmailTemplatesSeed::SALES_REQUEST_BODY)
csp.email_templates << EmailTemplate.create(name: "Sales - first contribution reminder", subject: EmailTemplatesSeed::SALES_REMIND1_SUBJECT, body: EmailTemplatesSeed::SALES_REMIND1_BODY)
csp.email_templates << EmailTemplate.create(name: "Sales - second contribution reminder", subject: EmailTemplatesSeed::SALES_REMIND2_SUBJECT, body: EmailTemplatesSeed::SALES_REMIND2_BODY)

cisco.create_email_templates

# Customers and Stories...
DemoCustomersSeed::DEMO_CUSTOMERS.each do |customer_info|
  puts customer_info
  customer = Customer.create(name: customer_info[:name], logo_url: customer_info[:logo])
  cisco.customers << customer
  success = Success.create
  customer.successes << success
  success.created_at = (rand*60).days.ago
  success.curator = curators[rand(2)]  # randomly select dan or ryan as curator
  success.save
  # 2/3 successes will have a story
  if rand(3) >= 1
    success.story = StoriesSeed::create
    # 1/2 stories will be approved/published (attributes default to false)
    if rand(2) == 1
      success.story.update(approved: true, published: true, logo_published: true, publish_date: Time.now)
    end
    # random industry category (tag)
    success.industry_categories << cisco.industry_categories[rand(0...cisco.industry_categories.count)]
    # random product category (tag)
    success.product_categories << cisco.product_categories[rand(0...cisco.product_categories.count)]
    # random product (tag)
    success.products << cisco.products[rand(0...cisco.products.count)]
    # each story has some visitors
    10.times { success.visitors << VisitorsSeed::create }

    # Contributions
    ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', user1 )
    ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', user2 )
    ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', user3 )
    ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', user4 )
    ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', user5 )

    ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'pre_request' )
    ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'feedback' )
    ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution' )

    # Results
    3.times do
      success.results << Result.create(description: FFaker::Lorem.sentence,
                                        success_id: success.id)
    end

    # Prompts
    success.prompts << Prompt.create(description: "What was the challenge?",
                                        success_id: success.id)
    success.prompts << Prompt.create(description: "What was the solution?",
                                        success_id: success.id)
    success.prompts << Prompt.create(description: "What are your estimated or measured results?",
                                        success_id: success.id)

  end  # story create
end





