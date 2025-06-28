# frozen_string_literal: true

FactoryBot.define do
  factory :invitation_template do
    name { 'Test Template' }

    company

    trait :with_placeholders do
      request_subject { '[contributor_first_name], contribute to a Customer Story' }
      request_body do
        <<~HTML
          <p>Hello, [contributor_full_name]. May I call you [contributor_first_name]?</p>
          <p>[referrer_full_name] referred me to you.</p>
          <p>My name is [curator_full_name].</p>
          <p>I work for [company_name] as a [curator_title].</p>
          <p>You can reach me at [curator_email] or by phone at [curator_phone].</p>
          <p>[contribution_submission_button={text:"Share Your Story",color:"#4d8664"}]</p>
        HTML
      end
    end
  end
end
