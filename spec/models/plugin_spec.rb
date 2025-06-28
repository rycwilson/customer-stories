require 'rails_helper'

RSpec.describe Plugin, type: :model do
  subject(:plugin) { build(:plugin) }

  describe 'factory' do
    it { is_expected.to be_valid }
  end

  describe 'validation' do
  end
end
