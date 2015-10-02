# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

Company.destroy_all
Customer.destroy_all
Story.destroy_all

Company.create(name:'Cisco')
cisco = Company.find_by(name:'Cisco')

Customer.create(name:'Ebay')
Customer.create(name:'Google')
Customer.create(name:'Microsoft')
Customer.create(name:'Twitter')
Customer.create(name:'IBM')
Customer.create(name:'Amazon')
Customer.create(name:'Facebook')
Customer.create(name:'Verizon')
Customer.create(name:'ATT')
Customer.create(name:'Sprint')

Customer.all.each do |customer|
  cisco.customers << customer
  10.times do
    success = Success.create()
    customer.successes << success
    success.story = Story.create(
                 title:FFaker::Lorem.sentence,
                 quote:FFaker::Company.bs,
            quote_attr:FFaker::Name.name << ", " << FFaker::Company.position,
             situation:FFaker::Lorem.paragraph,
             challenge:FFaker::Lorem.paragraph,
              solution:FFaker::Lorem.paragraph,
               results:FFaker::Lorem.paragraph)
  end
end





