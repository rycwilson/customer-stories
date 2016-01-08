
# This file assumes the existence of:
#
#   users: 'dlindblom@gmail.com', '***REMOVED***'
#   companies: 'Cisco', 'CSP'
#
#  ** All other data will be destroyed and re-created upon running this file **

require File.expand_path('../seeds/contributions', __FILE__)
require File.expand_path('../seeds/stories', __FILE__)
require File.expand_path('../seeds/visitors', __FILE__)
require File.expand_path('../seeds/email_templates', __FILE__)

# ref: http://stackoverflow.com/questions/619840/
# require "#{Rails.root}/db/seeds/contributions.rb"

# see config/initializers/constants.rb for generic list of industries
INDUSTRIES_CISCO = ['Automotive', 'Education', 'Energy', 'Financial Services', 'Government', 'Healthcare', 'Hospitality', 'Life Sciences', 'Manufacturing', 'Retail', 'Sports and Entertainment', 'Transportation']
CUSTOMERS = ['Ebay', 'Google', 'Microsoft', 'Twitter', 'IBM', 'Amazon', 'Facebook', 'Verizon', 'ATT', 'Sprint', 'GE', 'McKesson', 'GM', 'Ford', 'Costco', 'Kroger', 'Walmart', 'Apple', 'Prudential', 'Boeing', 'Citigroup', 'Target', 'Anthem', 'Metlife', 'Comcast', 'PepsiCo', 'AIG', 'UPS', 'Aetna', 'Caterpillar', 'FedEx', 'Pfizer', 'Disney', 'Sysco']
PROD_CATS = ['Servers', 'Switches', 'Routers', 'Networking Software', 'Security', 'Storage', 'Video']
PRODUCTS = ['UCS C3160', 'Nexus 7004', 'Catalyst 6807', 'ISR 4400', 'ASR 1001', 'IOS XR 5.1', 'AnyConnect 4.1', 'MDS 9500']

ROLES = ['customer', 'partner', 'sales']
STATUS_OPTIONS = ['pre_request', 'request', 'remind1', 'remind2', 'feedback', 'contribution', 'opt_out', 'did_not_respond']

dan = User.find_by(email:'***REMOVED***')
ryan = User.find_by(email:'***REMOVED***')
curators = [dan, ryan]
cisco = Company.find_by(name:'Cisco')
csp = Company.find_by(name:'CSP')

# destroy contributions first so deleted users don't orphan contributions (violates foreign key costraint)
# Note: not using (dependent: :destroy) for users -> contributions (or users -> successes)
Contribution.destroy_all
User.where.not("email = ? OR email = ?", "***REMOVED***", "***REMOVED***").destroy_all
Customer.destroy_all # also destroys successes, stories, visitors, and successes* join tables
# Product.destroy_all
# ProductCategory.destroy_all
# IndustryCategory.destroy_all
# ContributionEmail.destroy_all

# Cisco's target industries...
# INDUSTRIES_CISCO.each do |industry_name|
#   cisco.industry_categories << IndustryCategory.create(name: industry_name)
# end

# # Cisco's product categories and products...
# PROD_CATS.each do |category_name|
#   cisco.product_categories << ProductCategory.create(name: category_name)
# end
# PRODUCTS.each do |product_name|
#   cisco.products << Product.create(name: product_name)
# end

# Default email templates
# csp.contribution_emails << ContributionEmail.create(name: "customer_request", subject: EmailTemplatesSeed::REQUEST_SUBJECT, body: EmailTemplatesSeed::CUSTOMER_REQUEST_BODY)
# csp.contribution_emails << ContributionEmail.create(name: "customer_remind_1", subject: EmailTemplatesSeed::CUSTOMER_REMIND1_SUBJECT, body: EmailTemplatesSeed::CUSTOMER_REMIND1_BODY)
# csp.contribution_emails << ContributionEmail.create(name: "customer_remind_2", subject: EmailTemplatesSeed::CUSTOMER_REMIND2_SUBJECT, body: EmailTemplatesSeed::CUSTOMER_REMIND2_BODY)
# csp.contribution_emails << ContributionEmail.create(name: "partner_request", subject: EmailTemplatesSeed::REQUEST_SUBJECT, body: EmailTemplatesSeed::PARTNER_REQUEST_BODY)
# csp.contribution_emails << ContributionEmail.create(name: "partner_remind_1", subject: EmailTemplatesSeed::PARTNER_REMIND1_SUBJECT, body: EmailTemplatesSeed::PARTNER_REMIND1_BODY)
# csp.contribution_emails << ContributionEmail.create(name: "partner_remind_2", subject: EmailTemplatesSeed::PARTNER_REMIND2_SUBJECT, body: EmailTemplatesSeed::PARTNER_REMIND2_BODY)
# csp.contribution_emails << ContributionEmail.create(name: "sales_request", subject: EmailTemplatesSeed::REQUEST_SUBJECT, body: EmailTemplatesSeed::SALES_REQUEST_BODY)
# csp.contribution_emails << ContributionEmail.create(name: "sales_remind_1", subject: EmailTemplatesSeed::SALES_REMIND1_SUBJECT, body: EmailTemplatesSeed::SALES_REMIND1_BODY)
# csp.contribution_emails << ContributionEmail.create(name: "sales_remind_2", subject: EmailTemplatesSeed::SALES_REMIND2_SUBJECT, body: EmailTemplatesSeed::SALES_REMIND2_BODY)

# cisco.create_email_templates

# Customers and Stories...
['Ebay', 'Google', 'Microsoft', 'Twitter', 'IBM'].each do |customer_name|
  customer = Customer.create(name: customer_name)
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
    10.times do
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], STATUS_OPTIONS[rand(STATUS_OPTIONS.length)] )
    end

  end  # story create
end





