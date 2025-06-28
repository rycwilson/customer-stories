# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Contribution, type: :model do
  subject(:contribution) { build(:contribution) }

  describe 'factory' do
    it { is_expected.to be_valid }

    # context 'when created with an invitation_template' do
    #   subject(:contribution) { build(:contribution, :with_invitation_template) }

    #   it 'has an invitation template association' do
    #     expect(contribution.invitation_template).to be_present
    #   end
    # end
  end

  describe 'validation' do
    it 'requires a success' do
      contribution.success = nil
      expect(contribution).to be_invalid
      expect(contribution.errors[:success]).to include(I18n.t('activerecord.errors.messages.blank'))
    end
  end
end
