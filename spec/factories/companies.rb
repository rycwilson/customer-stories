FactoryBot.define do
  # the class argument can be left out and will be inferred from the factory name
  factory :company, class: 'Company' do
    name { Faker::Company.name }
    subdomain { Faker::Internet.domain_word }
    website { 'https://acme.com' }
    skip_callbacks { true }
  end
end