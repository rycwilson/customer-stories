
require File.expand_path('../seeds/demo_customers', __FILE__)
require File.expand_path('../seeds/contributions', __FILE__)
require File.expand_path('../seeds/stories', __FILE__)
require File.expand_path('../seeds/visitors', __FILE__)
require File.expand_path('../seeds/email_templates', __FILE__)

# ref: http://stackoverflow.com/questions/619840/
# require "#{Rails.root}/db/seeds/contributions.rb"

# see config/initializers/constants.rb for generic list of industries
INDUSTRIES_CISCO = ['Automotive', 'Education', 'Energy', 'Financial Services', 'Government', 'Healthcare', 'Hospitality', 'Life Sciences', 'Manufacturing', 'Retail', 'Sports and Entertainment', 'Transportation']
INDUSTRIES_ACME = ['Automotive', 'Manufacturing', 'Home & Garden', 'Steel', 'Pharmaceutical', 'Construction', 'Sports & Outdoors', 'Food', 'Party Supply', 'Clothing', 'Farm Equipment', 'Toys']
PROD_CATS_CISCO = ['Servers', 'Switches', 'Routers', 'Networking Software', 'Security', 'Storage', 'Video']
PROD_CATS_ACME = ['Heavy Equipment', 'Explosives', 'Roadrunner Traps', 'Outdoor Gear', 'Firearms', 'Ammunition', 'Appliances', 'Animal Feed', 'Winged Suits', 'Kitchen Essentials', 'Dietary Supplements', 'Costumes']
PRODUCTS_CISCO = ['UCS C3160', 'Nexus 7004', 'Catalyst 6807', 'ISR 4400', 'ASR 1001', 'IOS XR 5.1', 'AnyConnect 4.1', 'MDS 9500']
PRODUCTS_ACME = ['Anvil', 'Catapult', 'Bat Suit', 'Iron Carrot', 'Buck Shot', 'Axle Grease', 'Earthquake Pills', 'Rocket Sled', 'Detonator', 'Explosive Tennis Balls', 'Magnet', 'Super Speed Vitamins', 'Cement', 'Time-Space Gun', 'Giant Rubber Band' ]

ROLES = ['customer', 'partner', 'sales']
STATUS_OPTIONS = ['pre_request', 'request', 'remind1', 'remind2', 'feedback', 'contribution', 'opt_out', 'unsubscribe', 'did_not_respond']

dan = User.find_by(email:'***REMOVED***')
# dan = User.create(first_name:'Dan', last_name:'Lindblom', email:'***REMOVED***', linkedin_url:'https://www.linkedin.com/in/danlindblom', sign_up_code:'csp_beta', password:'password', photo_url: 'https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/0e2caaaf-d808-4279-b7ca-9929cfc6400c/dan.png')
ryan = User.find_by(email:'***REMOVED***')
joe = User.find_by(email:'***REMOVED***')
frank = User.find_by(email:'***REMOVED***')
# ryan = User.create(first_name:'Ryan', last_name:'Wilson', email:'***REMOVED***', linkedin_url:'https://www.linkedin.com/in/wilsonryanc', sign_up_code:'csp_beta', password:'password', photo_url: 'https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/099b59d3-1f35-4d8b-9183-a162a80bfbac/ryan.png')

acme = Company.find_by(name:'Acme')
acme.users.push(joe, frank)
# acme = Company.create(name:'Acme Test', subdomain:'acme-test',
#                   logo_url:"https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/4975cb76-14d7-4f09-a1ba-7726ae7fe6c3/acmecom.png",
#                   nav_color_1:"#0056d6", nav_color_2:"#5f69a3", nav_text_color:"#f0f0f0")
# acme.users << User.create(email:"acme-test@customerstories.net", first_name:'Dan', last_name:'acme-test', sign_up_code:'csp_beta', password:'password',
#                       linkedin_url:"https://www.linkedin.com/in/danlindblom",
#                       photo_url:"https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/1c396f91-6232-4bdb-916e-907fcf6f6905/dlindblo[2].jpg",
#                       phone:"650-327-6040", title:"Sales, Marketing, Entrepreneur, Investor, Advisor")

cisco = Company.find_by(name:'Cisco Systems')
cisco.users.push(dan, ryan)
# cisco = Company.create(name:'Cisco Systems', subdomain:'cisco', feature_flag:'demo',
#                    logo_url:'https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/6326ee57-e0e0-4a0b-aacb-9b59849f2c40/cisco-grey@2x.png',
#                    nav_color_1:'#007fc5', nav_color_2:'#2B5693' , nav_text_color:'#FCFCFD')
# cisco.users << dan << ryan

# trunity = Company.create(name:'Trunity', subdomain:'trunity',
#                     logo_url:"https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/7272f9a8-5a97-460f-b6c6-5b176e8880d3/trunity_logo.png",
#                     nav_color_1:'#ffffff', nav_color_2:'#ffffff', nav_text_color:"#2e7aa7")
# trunity.users << User.create(email:"trunity@customerstories.net", first_name:'Dan', last_name:'Lindblom', sign_up_code:'csp_beta', password:'password')
# trunity.users << User.create(email:"joakim@trunity.com", first_name:'Joakim', last_name:'Lindblom', sign_up_code:'csp_beta',
#                           linkedin_url:"https://www.linkedin.com/in/joakim-lindblom-9994aa",
#                           photo_url:"https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/95f51e64-1d0a-4354-8a69-02330449a22f/JFL-Canada-200x200.jpg",
#                           phone:"6507146209", title:"Cofounder, CTO & EVP at Trunity", password:'password')

# cg = Company.create(name:'Compas Global', subdomain:'compas',
#                 logo_url:"https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/4630e5d4-1c42-4565-b64f-aa066fc6da7d/compas.png",
#                 nav_color_1:'#f7f7f7' ,nav_color_2:'#ebebeb', nav_text_color:"#e55f53")
# cg.users << User.create(email:'compas@customerstories.net', first_name:'Dan', last_name:'Lindblom', sign_up_code:'csp_beta', password:'password')

# csp = Company.find_by(name:'CSP')
# csp = Company.create(name:'CSP', subdomain:'csp', feature_flag:'beta'
#                 logo_url:"https://s3-us-west-1.amazonaws.com/csp-production-assets/cs_logo.png",
#                 nav_color_1:"#FBFBFB", nav_color_2:"#85CEE6", nav_text_color:"#333333")
# csp.users << dan << ryan


# destroy contributions first so deleted users don't orphan contributions (violates foreign key costraint)
# Note: not using (dependent: :destroy) for users -> contributions (or users -> successes)
EmailContributionRequest.destroy_all
Contribution.destroy_all
Customer.destroy_all  # destroys successes, stories, visitors, and successes* join tables
Prompt.destroy_all
Result.destroy_all
User.where.not("email IN ('***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***')").destroy_all
Product.destroy_all
ProductCategory.destroy_all
IndustryCategory.destroy_all
# EmailTemplate.destroy_all

# some users with linkedin profiles (demo only)
user1 = User.create(first_name:'Carlos', last_name:'Ramon', email:'carlos@mail.com', linkedin_url:'https://www.linkedin.com/in/carlosramon', sign_up_code:'csp_beta', password:'password')
user2 = User.create(first_name:'Reza', last_name:'Raji', email:'reza@mail.com', linkedin_url:'https://www.linkedin.com/in/rezaraji', sign_up_code:'csp_beta', password:'password')
user3 = User.create(first_name:'Jeff', last_name:'Haslem', email:'jeffh@mail.com', linkedin_url:'https://www.linkedin.com/in/jeffhaslem', sign_up_code:'csp_beta', password:'password')
user4 = User.create(first_name:'Allan', last_name:'Lo', email:'allan@mail.com', linkedin_url:'https://www.linkedin.com/pub/allan-lo/2/80/214', sign_up_code:'csp_beta', password:'password')
user5 = User.create(first_name:'Jeff', last_name:'Weiner', email:'jeffw@mail.com', linkedin_url:'https://www.linkedin.com/in/jeffweiner08', sign_up_code:'csp_beta', password:'password')

# Cisco's target industries...
INDUSTRIES_CISCO.each do |industry_name|
  cisco.industry_categories << IndustryCategory.create(name: industry_name)
end

# Acme's target industries...
INDUSTRIES_ACME.each do |industry_name|
  acme.industry_categories << IndustryCategory.create(name: industry_name)
end


# Cisco's product categories and products...
# PROD_CATS_CISCO.each do |category_name|
#   cisco.product_categories << ProductCategory.create(name: category_name)
# end
PRODUCTS_CISCO.each do |product_name|
  cisco.products << Product.create(name: product_name)
end

# Acme's product categories and products...
# PROD_CATS_ACME.each do |category_name|
#   acme.product_categories << ProductCategory.create(name: category_name)
# end
PRODUCTS_ACME.each do |product_name|
  acme.products << Product.create(name: product_name)
end
# Default email templates
# csp.email_templates << EmailTemplate.create(name: "Customer", subject: EmailTemplatesSeed::REQUEST_SUBJECT, body: EmailTemplatesSeed::CUSTOMER_BODY)
# csp.email_templates << EmailTemplate.create(name: "Partner", subject: EmailTemplatesSeed::REQUEST_SUBJECT, body: EmailTemplatesSeed::PARTNER_BODY)
# csp.email_templates << EmailTemplate.create(name: "Sales", subject: EmailTemplatesSeed::REQUEST_SUBJECT, body: EmailTemplatesSeed::SALES_BODY)

# Company.where.not(name:'CSP').each { |c| c.create_email_templates }
acme.create_email_templates

# Customers and Stories...

def seed_company company, *users
  DemoCustomersSeed::DEMO_CUSTOMERS.each do |customer_info|
    customer = Customer.create(name: customer_info[:name],
                           logo_url: customer_info[:logo],
                         company_id: company.id)
    success = Success.create
    customer.successes << success
    success.created_at = (rand*60).days.ago
    success.curator = company.users[rand(2)]  # randomly select curator
    success.save
    # 2/3 successes will have a story
    if rand(3) >= 1
      success.story = StoriesSeed::create
      # 2/3 stories have logo published
      if rand(3) >= 1
        success.story.update(logo_published: true, logo_publish_date: Time.now)
        # 1/2 of published logos are published stories (1/3 of stories are published)
        if rand(2) == 0
          success.story.update(approved: true, published: true, publish_date: Time.now)
        end
      end
      # random industry category (tag)
      success.industry_categories << company.industry_categories[rand(0...company.industry_categories.count)]
      # random product category (tag)
      # success.product_categories << company.product_categories[rand(0...company.product_categories.count)]
      # random product (tag)
      success.products << company.products[rand(0...company.products.count)]
      # each story has some visitors
      10.times { success.visitors << VisitorsSeed::create }

      # Contributions
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', users[0] )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', users[1] )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', users[2] )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', users[3] )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution', users[4] )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'pre_request' )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'feedback' )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'did_not_respond', nil, 10.days.ago )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'opt_out' )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'unsubscribe' )
      ContributionsSeed::create( success.id, ROLES[rand(ROLES.length)], 'contribution' )


      # Result
      success.results << Result.create(description: "Achieves #{rand(50)+50}% higher Data Center speeds",
                                          success_id: success.id)

      # Prompts
      success.prompts << Prompt.create(description: "What was the challenge?",
                                          success_id: success.id)
      success.prompts << Prompt.create(description: "What was the solution?",
                                          success_id: success.id)
      success.prompts << Prompt.create(description: "What are your estimated or measured results?",
                                          success_id: success.id)

    end  # story create
  end
end

seed_company(cisco, user1, user2, user3, user4, user5)
seed_company(acme, user1, user2, user3, user4, user5)







