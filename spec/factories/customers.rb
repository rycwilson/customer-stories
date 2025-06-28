# frozen_string_literal: true

FactoryBot.define do
  factory :customer, class: 'Customer' do
    name { Faker::Company.name }
    logo_url { 'must have a value or stories can not be featured' }
    skip_callbacks { true }

    company
  end
end
