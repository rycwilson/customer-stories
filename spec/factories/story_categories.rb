FactoryBot.define do
  factory :story_category do
    name { Faker::Commerce.department }
    company
  end
end