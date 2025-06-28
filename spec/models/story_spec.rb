# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Story, type: :model do
  describe 'factory' do
    it { is_expected.to be_valid }
  end
  subject(:story) { build(:story) }

  describe 'validation' do
    it 'requires a title' do
      story.title = nil
      expect(story).to be_invalid
      expect(story.errors[:title]).to include(I18n.t('activerecord.errors.messages.blank'))
    end
  end
end
