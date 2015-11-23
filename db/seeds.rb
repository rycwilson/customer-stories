# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

# Company.destroy_all
Customer.destroy_all # also destroys successes, stories, and successes* join tables
Product.destroy_all
ProductCategory.destroy_all
IndustryCategory.destroy_all

# cisco = Company.create(name:'Cisco')
# cisco.users << User.find_by(email:'***REMOVED***')
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
['Ebay', 'Google', 'Microsoft', 'Twitter', 'IBM', 'Amazon', 'Facebook', 'Verizon', 'ATT', 'Sprint'].each do |customer_name|
  customer = Customer.create(name: customer_name)
  cisco.customers << customer
  10.times do
    success = Success.create()
    customer.successes << success
    # random seed value
    seed = (rand(0..1) == 1) ? 1 : nil
    if seed
      story = Story.create(
                 title:FFaker::Lorem.sentence,
                 quote:FFaker::Lorem.sentences.join(" "),
            quote_attr:FFaker::Name.name << ", " << FFaker::Company.position,
             situation:FFaker::Lorem.paragraphs.join(" "),
             challenge:FFaker::Lorem.paragraphs.join(" "),
              solution:FFaker::Lorem.paragraphs.join(" "),
               results:FFaker::Lorem.paragraphs.join(" "),
             embed_url:"https://www.youtube.com/embed/hecXupPpE9o")
      seed = (rand(0..1) == 1) ? 1 : nil
      if seed
        success.update(approved?: true)
        success.update(published?: true)
      else
        # defaults to false
      end
      success.story = story
      success.industry_categories << cisco.industry_categories[rand(0...12)]
      success.update(publish_date: Time.now)
      # each story has some visitors
      10.times do
        success.visitors << Visitor.create(
              organization: FFaker::Company.name,
              city: FFaker::AddressUS.city,
              state: FFaker::AddressUS.state_abbr )
      end
    end
  end
end




