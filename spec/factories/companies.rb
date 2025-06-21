# frozen_string_literal: true

FactoryBot.define do
  # the class argument can be left out and will be inferred from the factory name
  factory :company, class: 'Company' do
    name { Faker::Company.name }
    subdomain do
      loop do
        candidate = Faker::Internet.domain_word.downcase
        company = Company.new(subdomain: candidate, name: 'Test', website: 'https://example.com', skip_callbacks: true)
        break candidate if company.valid?
      end
    end
    website { "https://example.com?q=#{Faker::Internet.slug}" } # needs to be real site, but also unique
    skip_callbacks { true }

    factory :company_with_tags do
      after(:create) do |company|
        create_list(:story_category, 3, company: company)
        create_list(:product, 3, company: company)
      end
    end
  end
end
