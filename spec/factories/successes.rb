FactoryBot.define do
  factory :success do
    name { Faker::Lorem.sentence }
    company 
    customer 
    association :curator, factory: :user

    factory :success_with_contributions do
      transient do
        contributions_count { 3 }
      end

      after(:build) do |success, evaluator|
        create_list(:contribution, evaluator.contributions_count, success: success)
      end
    end

    trait :with_story do 
      association :story
    end
  end
end