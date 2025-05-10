require 'rails_helper'

RSpec.describe Customer, type: :model do
  # let(:company) { build(:company) }
 
  subject(:customer) { build(:customer) }

  describe 'associations' do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to have_many(:successes).dependent(:destroy) }
    it { is_expected.to have_many(:stories).through(:successes) }
    it { is_expected.to have_many(:contributions).through(:successes) }
    it { is_expected.to have_many(:contributors).through(:contributions) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name).scoped_to(:company_id) }
  end

  describe 'friendly_id' do
    after { customer.destroy }
    it 'should generate a new friendly_id when the name changes' do
      customer.name = 'New Name'
      customer.save
      expect(customer.slug).to eq('new-name')
    end
  end

  # describe 'callbacks' do
  #   it 'should delete the previous logo from S3 when the logo_url changes' do
  #     customer.logo_url = 'new_logo_url'
  #     customer.save
  #     expect(S3Util).to receive(:delete_object).with(S3_BUCKET, customer.previous_changes[:logo_url].first)
  #     customer.run_callbacks(:update_commit)
  #   end
  # end

  describe 'factory' do
    it { is_expected.to be_valid }

    it 'should create a customer with a company association' do
      expect(customer.company).to be_present
    end
  end
end