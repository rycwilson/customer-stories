FactoryBot.define do
  factory :contribution do
    success
    association :contributor, factory: :user
  end
end
