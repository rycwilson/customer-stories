# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  subject(:user) { build(:user) }

  describe 'factory' do
    it { is_expected.to be_valid }

    context 'when user is a curator' do
      subject(:curator) { build(:curator) }

      it 'belongs to a company' do
        expect(curator.company).to be_present
      end
    end
  end

  describe 'validation' do
    let(:existing_user) { create(:user) }

    it 'requires a first name' do
      user.first_name = nil
      expect(user).to be_invalid
      expect(user.errors[:first_name]).to include(I18n.t('activerecord.errors.messages.blank'))
    end

    it 'requires an email' do
      user.email = nil
      expect(user).to be_invalid
      expect(user.errors[:email]).to include(I18n.t('activerecord.errors.messages.blank'))
    end

    it 'requires a unique email' do
      user.email = existing_user.email
      expect(user).to be_invalid
      expect(user.errors[:email]).to include(I18n.t('errors.messages.taken'))
    end

    it 'requires a password' do 
      user.password = nil
      expect(user).to be_invalid
      expect(user.errors[:password]).to include(I18n.t('activerecord.errors.messages.blank'))
    end

    # TODO: phone format validation
  end

  describe '#full_name' do
    it 'cocatenates first and last names' do
      expect(user.full_name).to eq("#{user.first_name} #{user.last_name}")
    end
  end
end
