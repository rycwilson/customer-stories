# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Success, type: :model do
  subject(:success) { build(:success) }

  describe 'factory' do
    it { is_expected.to be_valid }

    # context 'when created with a story' do
    #   subject(:success) { build(:success, :with_story) }

    #   it 'has a story association' do
    #     expect(success.story).to be_present
    #   end
    # end
  end

  describe 'validation' do
    it 'requires a customer' do
      success.customer = nil
      expect(success).to be_invalid
      expect(success.errors[:customer]).to include(I18n.t('activerecord.errors.messages.blank'))
    end
  end
end
