require 'rails_helper'

RSpec.describe Product, type: :model do
  subject(:product) { build(:product) }

  describe 'factory' do
    it { is_expected.to be_valid }

    it 'belongs to a company' do
      expect(product.company).to be_present
    end
  end

  describe 'validation' do
    it 'requires a name' do
      product.name = nil
      expect(product).to be_invalid
      expect(product.errors[:name]).to include('is required')
    end

    it 'requires a unique name within the scope of a company' do
      existing_category = create(:product, name: 'Unique Product', company: product.company)
      product.name = existing_category.name
      expect(product).to be_invalid
      expect(product.errors[:name]).to include('has already been taken')
    end
  end
end
