# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

#Company.destroy_all

# destroy contributions first so deleted users don't orphan contributions (violates foreign key costraint)
# -> not using dependent: :destroy for users -> contributions
Contribution.destroy_all
User.where.not("email = ? OR email = ?", "***REMOVED***", "***REMOVED***").destroy_all
Customer.destroy_all # also destroys successes, stories, visitors, and successes* join tables
Product.destroy_all
ProductCategory.destroy_all
IndustryCategory.destroy_all

dan = User.find_by(email:'***REMOVED***')
ryan = User.find_by(email:'***REMOVED***')
curators = [dan, ryan]

def create_contributor first_name=nil, last_name=nil, cont_email=nil, linkedin_url=nil
  email = FFaker::Internet.email # need to use the same value twice, so store in variable
  contributor = User.new(
      first_name: first_name || FFaker::Name.first_name,
       last_name: last_name || FFaker::Name.last_name,
           email: cont_email || email,
    # password is necessary, so just set it to the email
        password: email,
    linkedin_url: linkedin_url,
    sign_up_code: 'csp_beta')
  puts contributor.errors.full_messages unless contributor.save
  contributor
end

def create_contribution success_id, contributor_id, role, status
  text = FFaker::Lorem.paragraph
  (status == 'feedback') ? feedback = text : feedback = nil
  (status == 'contribution') ? contribution = text : contribution = nil
  contribution = Contribution.new(
     success_id: success_id,
        user_id: contributor_id,
           role: role,
         status: status,
       feedback: feedback,
   contribution: contribution)
  puts contribution.errors.full_messages unless contribution.save
  contribution
end

# cisco = Company.create(name:'Cisco')
# cisco.users << User.find_by(email:'joe@mail.com')
cisco = Company.find_by(name:'Cisco')

# Cisco's target industries...
['Automotive', 'Education', 'Energy', 'Financial Services', 'Government', 'Healthcare', 'Hospitality', 'Life Sciences', 'Manufacturing', 'Retail', 'Sports and Entertainment', 'Transportation'].each do |industry_category|
  cisco.industry_categories << IndustryCategory.create(name: industry_category)
end

# Cisco's product categories and products...
['Servers', 'Switches', 'Routers', 'Networking Software', 'Security', 'Storage', 'Video'].each do |category_name|
  cisco.product_categories << ProductCategory.create(name: category_name)
end
['UCS C3160', 'Nexus 7004', 'Catalyst 6807', 'ISR 4400', 'ASR 1001', 'IOS XR 5.1', 'AnyConnect 4.1', 'MDS 9500'].each do |product_name|
  cisco.products << Product.create(name: product_name)
end

# Customers...
['Ebay', 'Google', 'Microsoft', 'Twitter', 'IBM', 'Amazon', 'Facebook', 'Verizon', 'ATT', 'Sprint', 'GE', 'McKesson', 'GM', 'Ford', 'Costco', 'Kroger', 'Walmart', 'Apple', 'Prudential', 'Boeing', 'Citigroup', 'Target', 'Anthem', 'Metlife', 'Comcast', 'PepsiCo', 'AIG', 'UPS', 'Aetna', 'Caterpillar', 'FedEx', 'Pfizer', 'Disney', 'Sysco'].each do |customer_name|
  customer = Customer.create(name: customer_name)
  cisco.customers << customer
  success = Success.create()
  customer.successes << success
  success.created_at = (rand*60).days.ago
  success.curator = curators[rand(2)]  # randomly select dan or ryan as curator
  success.save
  # 2/3 successes will have a story
  if rand(3) >= 1
    story = Story.create(
               title:FFaker::Lorem.sentence,
               quote:FFaker::Lorem.sentences.join(" "),
          quote_attr:FFaker::Name.name << ", " << FFaker::Company.position,
           situation:FFaker::Lorem.paragraphs.join(" "),
           challenge:FFaker::Lorem.paragraphs.join(" "),
            solution:FFaker::Lorem.paragraphs.join(" "),
             results:FFaker::Lorem.paragraphs.join(" "),
           embed_url:"https://www.youtube.com/embed/hecXupPpE9o")
    # 1/2 stories will be approved/published
    if rand(2) == 1
      success.update(approved?: true)
      success.update(published?: true)
      success.update(publish_date: Time.now)
    else
      # attributes default to false
    end
    success.story = story
    success.industry_categories << cisco.industry_categories[rand(0...12)]
    # each story has some visitors
    10.times do
      success.visitors << Visitor.create(
                            organization: FFaker::Company.name,
                                    city: FFaker::AddressUS.city,
                                   state: FFaker::AddressUS.state_abbr,
                              created_at: (rand*60).days.ago)
    end

    # Contributions
    roles = ['Customer', 'Partner', 'Sales Team']
    status_options = ['request1', 'request2', 'request3', 'did_not_respond', 'feedback', 'contribution', 'opt_out']

    # pre-request contributions
    3.times do
      role = roles[rand(roles.length)]
      contributor = create_contributor
      success.contributions <<
        create_contribution(success.id, contributor.id, role, 'pre-request')
    end

    # contributions in progress
    3.times do
      role = roles[rand(roles.length)]
      # status is either request* or did_not_respond
      status = status_options[rand(4)]
      contributor = create_contributor
      success.contributions <<
        create_contribution(success.id, contributor.id, role, status)
    end

    # feedback
    3.times do
      role = roles[rand(roles.length)]
      contributor = create_contributor
      success.contributions <<
        create_contribution(success.id, contributor.id, role, 'feedback')
    end

    # contribution
    2.times do
      role = roles[rand(roles.length)]
      contributor = create_contributor
      success.contributions <<
        create_contribution(success.id, contributor.id, role, 'contribution')
    end

  end  # story create
end





