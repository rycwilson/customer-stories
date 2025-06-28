# frozen_string_literal: true

FactoryBot.define do
  factory :user, aliases: %i[contributor referrer sender recipient] do
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    email { Faker::Internet.email }
    password { Faker::Internet.password }
    sign_up_code { 'csp_beta' }
    skip_callbacks { true }

    factory :curator do
      company
    end
  end
end
