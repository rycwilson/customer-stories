FactoryBot.define do
  factory :result do
    description { Faker::Company.bs }
    story
  end
end
