FactoryBot.define do
  factory :story do
    title { Faker::Lorem.sentence }
    success
    customer
    association :curator, factory: :user
    # skip_callbacks { true }
  end
end