FactoryBot.define do
  factory :story do
    title { Faker::Lorem.sentence }
    association :success, factory: [:success, :with_story]
    association :curator, factory: :user
    # skip_callbacks { true }

  end
end