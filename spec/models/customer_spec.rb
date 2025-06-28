# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Customer, type: :model do
  subject(:customer) { build(:customer) }

  describe 'factory' do
    it { is_expected.to be_valid }
  end

  describe 'validation' do
    it 'requires a company' do
      customer.company = nil
      expect(customer).to be_invalid
      expect(customer.errors[:company]).to include(I18n.t('activerecord.errors.messages.blank'))
    end
  end

  # describe 'friendly_id' do
  #   after { customer.destroy }
  #   it 'should generate a new friendly_id when the name changes' do
  #     customer.name = 'New Name'
  #     customer.save
  #     expect(customer.slug).to eq('new-name')
  #   end
  # end

  # describe 'callbacks' do
  #   it 'should delete the previous logo from S3 when the logo_url changes' do
  #     customer.logo_url = 'new_logo_url'
  #     customer.save
  #     expect(S3Util).to receive(:delete_object).with(S3_BUCKET, customer.previous_changes[:logo_url].first)
  #     customer.run_callbacks(:update_commit)
  #   end
  # end
end
