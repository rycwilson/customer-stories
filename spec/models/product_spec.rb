require 'rails_helper'

RSpec.describe Product, type: :model do
  subject { FactoryBot.build(:product) }

  it 'is valid with valid attributes' do
    expect(subject).to be_valid
  end

  it 'is not valid without a name' do 
    subject.name = nil
    expect(subject).not_to be_valid
  end

  it 'is not valid without a unique name within the scope of a company' do 
    company = FactoryBot.create(:company)
    FactoryBot.create(:product, name: 'Example Product', company: company)
    subject.name = 'Example Product'
    subject.company = company
    expect(subject).not_to be_valid
  end
end
