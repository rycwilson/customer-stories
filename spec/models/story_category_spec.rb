require 'rails_helper'

RSpec.describe StoryCategory, type: :model do
  subject(:story_category) { build(:story_category) }

  describe 'factory' do
    it { is_expected.to be_valid }

    it 'belongs to a company' do
      expect(story_category.company).to be_present
    end
  end

  describe 'validation' do
    it 'requires a name' do
      story_category.name = nil
      expect(story_category).to be_invalid
      expect(story_category.errors[:name]).to include('is required')
    end

    it 'requires a unique name within the scope of a company' do
      existing_category = create(:story_category, name: 'Unique Category', company: story_category.company)
      story_category.name = existing_category.name
      expect(story_category).to be_invalid
      expect(story_category.errors[:name]).to include('has already been taken')
    end
  end
end
