FactoryBot.define do
  # the class argument can be left out and will be inferred from the factory name
  factory :company, class: 'Company' do
    name { Faker::Company.name }
    subdomain { Faker::Internet.domain_word }
    website { "https://example.com?q=#{Faker::Internet.slug}" }    # needs to be real site, but also unique
    skip_callbacks { true }
  end
end