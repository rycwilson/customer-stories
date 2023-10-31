require 'rails_helper'

RSpec.describe Plugin, type: :model do
  subject(:plugin) { build(:plugin) }

  describe 'associations' do
    it { is_expected.to belong_to(:company) }
  end

  describe 'validations' do
  end

  describe 'factory' do
    it { is_expected.to be_valid }

    it 'should create a plugin with a company association' do
      expect(plugin.company).to be_present
    end

    it 'defaults to a hidden state' do
      pending('awaiting consolidation of show/hide fields')
      fail
    end
  end
end
