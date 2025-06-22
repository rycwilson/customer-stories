require 'rails_helper'

RSpec.describe Product, type: :model do
  subject(:product) { build(:product) }
  let(:existing_company) { create(:company) }

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
      expect(product.errors[:name]).to include(I18n.t('activerecord.errors.messages.blank'))
    end

    it 'requires a unique name within the scope of a company' do
      existing_product = create(:product, name: 'Unique Product', company: product.company)
      product.name = existing_product.name
      expect(product).to be_invalid
      expect(product.errors[:name]).to include(I18n.t('errors.messages.taken'))
    end

    it 'allows duplicated names outside the scope of a company' do
      existing_product = create(:product, name: 'Duplicated Product', company: existing_company)
      product.name = existing_product.name
      expect(product).to be_valid
    end
  end
end
