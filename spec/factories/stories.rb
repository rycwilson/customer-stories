FactoryBot.define do
  factory :story do
    title { Faker::Lorem.sentence }
    association :success
    association :customer
    association :curator, factory: :user
    # skip_callbacks { true }
  end
end