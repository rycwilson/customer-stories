require 'rails_helper'

RSpec.describe User, type: :model do
  subject(:user) { build(:user) }

  describe 'associations' do
    it { is_expected.to belong_to(:company).optional }
    
    context 'when user is a curator' do
      subject(:curator) { build(:curator) }

      it { is_expected.to have_many(:successes).with_foreign_key('curator_id') }
    end


    # it { is_expected.to have_many(:stories).through(:successes) }
    # it { is_expected.to have_many(:contributions).through(:successes) }

    # TODO test that the contributors association is distinct (users can have multiple contributions)
    # it { is_expected.to have_many(:contributors).through(:contributions).source(:contributor) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:first_name) }
    it { is_expected.to validate_presence_of(:last_name) }
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_presence_of(:password) }
    # TODO: phone format validation
  end

  describe 'factory' do
    it { is_expected.to be_valid }

    context 'when user is a curator' do
      subject(:curator) { build(:curator) }

      it 'belongs to a company' do
        expect(curator.company).to be_present
      end
    end
  end

  describe '#full_name' do
    it 'cocatenates first and last names' do
      expect(user.full_name).to eq(user.first_name + " " + user.last_name)
    end
  end
end
