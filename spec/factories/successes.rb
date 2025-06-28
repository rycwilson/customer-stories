# frozen_string_literal: true

FactoryBot.define do
  factory(:success) do
    name { Faker::Lorem.sentence }
    customer
    curator

    # factory(:success_with_contributions) do
    #   transient do
    #     contributions_count { 3 }
    #   end

    #   after(:build) do |success, evaluator|
    #     build_list(:contribution, evaluator.contributions_count)
    #   end

    #   contributions do
    #     Array.new(contributions_count) { association(:contribution, success: instance) }
    #   end
    # end

    # factory(:success_with_story_categories) do
    #   after(:create) do |success, evaluator|
    #     create_list(:story_category, 3, company: success.company, successes: [success])
    #   end
    # end

    # trait(:with_story) do
    #   association(:story)
    # end
  end
end
