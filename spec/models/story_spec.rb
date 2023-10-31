require 'rails_helper'

RSpec.describe Story, type: :model do
  subject(:story) { build(:story) }

  describe 'associations' do
    it { is_expected.to belong_to(:success) }
    it { is_expected.to have_one(:company).through(:success) }
    it { is_expected.to have_one(:customer).through(:success) }
    it { is_expected.to have_one(:curator).through(:success).class_name('User') }
    it { is_expected.to have_many(:contributions).through(:success) }
    it { is_expected.to have_many(:contributors).through(:success) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:title) }

    # unique across companies, since friendly_id allows a search based on the title slug
    it { is_expected.to validate_uniqueness_of(:title) }
  end
  
  describe 'factory' do
    it { is_expected.to be_valid }

    it 'has a success association' do
      expect(story.success).to be_present
    end

    it 'has a customer association' do
      expect(story.customer).to be_present
    end

    it 'has a curator association' do
      expect(story.curator).to be_present
    end
  end
end
