FactoryBot.define do
  factory :contributor_invitation do
    email_subject { "MyText" }
    email_body { "MyText" }
    sent_at { "2024-06-25 15:20:50" }
    contribution_id { nil }
  end
end
