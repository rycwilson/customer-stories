FactoryBot.define do
  factory :tag do
    name { "MyString" }
    type { "" }
    company { nil }

    factory :category_tag, class: 'Tag::Category' do
      type { 'Tag::Category' }
      sequence(:name) { |n| "#{Faker::Commerce.department} #{n}" }
      company
    end

    factory :product_tag, class: 'Tag::Product' do
      type { 'Tag::Product' }
      sequence(:name) { |n| "#{Faker::Commerce.product_name} #{n}" }
      company
    end
  end
end
