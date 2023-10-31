FactoryBot.define do
  factory :success do
    name { Faker::Lorem.sentence }
    association :company
    association :customer
    association :curator, factory: :user
    trait :with_story do 
      association :story
    end
    # skip_callbacks { true }
  end
end