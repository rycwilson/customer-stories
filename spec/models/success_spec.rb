require 'rails_helper'

RSpec.describe Success, type: :model do
  subject(:success) { build(:success) }

  describe 'associations' do
    it { is_expected.to have_one(:company).through(:customer) }
    it { is_expected.to belong_to(:customer) }
    it { is_expected.to belong_to(:curator).class_name('User').with_foreign_key('curator_id') }
    it { is_expected.to have_one(:story).optional.dependent(:destroy) }
  end

  describe 'validations' do
    it { is_expected.to validate_uniqueness_of(:name).scoped_to(:customer_id) }
  end

  describe 'factory' do
    it { is_expected.to be_valid }

    it 'has a company association' do
      expect(success.company).to be_present
    end

    it 'has a customer association' do
      expect(success.customer).to be_present
    end

    it 'has a curator association' do
      expect(success.curator).to be_present
    end

    context 'when created with a story' do
      subject(:success) { build(:success, :with_story) }

      it 'has a story association' do
        expect(success.story).to be_present
      end
    end
  end
end
