FactoryBot.define do
  factory :user do
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    email { Faker::Internet.email }
    password { Faker::Internet.password }
    sign_up_code { "csp_beta" }
    skip_callbacks { true }

    factory :curator do
      association :company
    end
  end
end