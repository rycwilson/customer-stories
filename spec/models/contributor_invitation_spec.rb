# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ContributorInvitation, type: :model do
  subject(:invitation) { build(:contributor_invitation) }

  describe 'factory' do
    it { is_expected.to be_valid }
  end

  describe 'validation' do
    it 'requires a contribution' do
      invitation.contribution = nil
      expect(invitation).to be_invalid
      expect(invitation.errors[:contribution]).to(
        include I18n.t('activerecord.errors.messages.blank')
      )
    end
  end
end
