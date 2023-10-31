require 'rails_helper'

RSpec.describe Contribution, type: :model do
  subject(:contribution) { build(:contribution) }

  describe 'associations' do
    it { is_expected.to belong_to(:success) }
    it { is_expected.to have_one(:customer).through(:success) }
    it { is_expected.to have_one(:company).through(:success) }
    it { is_expected.to have_one(:curator).through(:success) }
    it { is_expected.to have_one(:story).through(:success) }
    it { is_expected.to belong_to(:invitation_template).optional }

    # TODO: not sure the contributor relationship should be optional
    it { is_expected.to belong_to(:contributor).class_name('User').with_foreign_key('contributor_id').optional }
    it { is_expected.to belong_to(:referrer).class_name('User').with_foreign_key('referrer_id').optional }
  end

  describe 'validations' do
    it { is_expected.to validate_uniqueness_of(:contributor_id).scoped_to(:success_id) }
  end
  
  describe 'factory' do
    it { is_expected.to be_valid }

    it 'has a success association' do
      expect(contribution.success).to be_present
    end

    it 'has a contributor association' do
      expect(contribution.contributor).to be_present
    end

    # context 'when created with an invitation_template' do
    #   subject(:contribution) { build(:contribution, :with_invitation_template) }

    #   it 'has an invitation template association' do
    #     expect(contribution.invitation_template).to be_present
    #   end
    # end
  end
end
