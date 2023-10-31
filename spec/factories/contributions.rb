FactoryBot.define do
  factory :contribution do
    association :success
    association :contributor, factory: :user

    # trait :with_invitation_template do
    #   association :invitation_template
    # end
  end
end
