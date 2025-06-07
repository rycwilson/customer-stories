FactoryBot.define do
  factory :story do
    title { Faker::Lorem.sentence }
    summary { Faker::Lorem.paragraph(sentence_count: 2) }
    quote { Faker::Lorem.sentence }
    quote_attr_name { Faker::Name.name }
    quote_attr_title { Faker::Job.title }
    narrative { Faker::Lorem.paragraphs(number: 3).join("\n\n") }
    
    # By default, don't create circular dependencies between story and success
    association :success, factory: :success, strategy: :build
    association :curator, factory: :user

    # skip_callbacks { true }

    trait :with_results do
      transient do
        results_count { 2 }
      end

      after(:create) do |story, evaluator|
        create_list(:result, evaluator.results_count, story: story)
      end
    end

    trait :with_categories_and_products do
      after(:create) do |story, evaluator|
        success = story.success
        create_list(:story_category, 2, company: success.company, successes: [success])
        create_list(:product, 2, company: success.company, successes: [success])
      end
    end
  end
end