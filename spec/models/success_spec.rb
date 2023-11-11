require 'rails_helper'

RSpec.describe Success, type: :model do
  subject(:success) { build(:success) }

  describe 'associations' do
    it { is_expected.to belong_to(:customer) }
    it { is_expected.to have_one(:company).through(:customer) }
    it { is_expected.to belong_to(:curator).class_name('User').with_foreign_key('curator_id') }
    it { is_expected.to have_many(:contributions).inverse_of(:success).dependent(:destroy) }
    it { is_expected.to have_one(:story).optional.dependent(:destroy) }
    it { is_expected.to have_and_belong_to_many(:story_categories) }
  
    # context 'when a story_category is removed' do
    #   subject(:success) { build(:success_with_story_categories) }

    #   it 'executes a callback' do
    #     story_category = success.story_categories.last
    #     expect(success).to receive(:removed_story_category).once
    #     success.story_categories.delete(story_category)
    #   end
    # end
  end

  describe 'validations' do
    it { is_expected.to validate_uniqueness_of(:name).scoped_to(:customer_id) }
  end

  describe 'factory' do
    it { is_expected.to be_valid }

    it 'has a company' do
      expect(success.company).to be_present
    end

    it 'has a customer' do
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
