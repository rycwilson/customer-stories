FactoryBot.define do
  factory :customer, class: 'Customer' do
    name { Faker::Company.name }
    skip_callbacks { true }
    association :company
  end
end