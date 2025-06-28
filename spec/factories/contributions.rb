# frozen_string_literal: true

FactoryBot.define do
  factory :contribution do
    success
    contributor

    trait :with_referrer do
      referrer
    end
  end
end
