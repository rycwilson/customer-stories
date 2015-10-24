# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

# Company.destroy_all
Customer.destroy_all
Story.destroy_all

cisco = Company.create(name:'Cisco')

#cisco.users << User.find_by(email:'joe@mail.com')

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

    success = Success.create()
    customer.successes << success
      10.times do
      success.visitors << Visitor.create(
              organization: FFaker::Company.name,
              city: FFaker::AddressUS.city,
              state: FFaker::AddressUS.state_abbr )
      end
    success.story = Story.create(
                 title:FFaker::Lorem.sentence,
                 quote:FFaker::Lorem.sentences.join(" "),
            quote_attr:FFaker::Name.name << ", " << FFaker::Company.position,
             situation:FFaker::Lorem.paragraphs.join(" "),
             challenge:FFaker::Lorem.paragraphs.join(" "),
              solution:FFaker::Lorem.paragraphs.join(" "),
               results:FFaker::Lorem.paragraphs.join(" "),
             embed_url:"https://www.youtube.com/embed/hecXupPpE9o")

end




