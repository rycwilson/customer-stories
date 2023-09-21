FactoryBot.define do
  factory :company do
    name { Faker::Company.name }
    subdomain { Faker::Internet.domain_word }
    website { 'https://acme.com' }
    skip_callbacks { true }
  end
end