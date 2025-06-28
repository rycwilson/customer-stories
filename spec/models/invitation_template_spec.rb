# frozen_string_literal: true

require 'rails_helper'

PLACEHOLDERS = %w[
  contributor_first_name
  contributor_full_name
  referrer_full_name
  curator_full_name
  curator_title
  curator_email
  curator_phone
  company_name
] << 'contribution_submission_button={text:"Share Your Story",color:"#4d8664"}'

RSpec.describe InvitationTemplate, type: :model do
  subject(:template) { build(:invitation_template) }
  let(:curator) { build(:curator) }
  let(:success) { build(:success, curator:) }
  let(:invitation) { build(:contributor_invitation, success:) }

  describe 'factory' do
    it { is_expected.to be_valid }

    context 'when ready to populate' do
      let(:template) { build(:invitation_template, :with_placeholders) }

      it 'has subject and body with placeholders' do
        expect(template.request_subject).to be_present
        PLACEHOLDERS.each do |placeholder|
          expect(template.request_body).to include("[#{placeholder}]")
        end
      end
    end
  end

  describe 'validation' do
    it 'requires a name' do
      template.name = nil
      expect(template).to be_invalid
      expect(template.errors[:name]).to include(I18n.t('activerecord.errors.messages.blank'))
    end

    it 'requires a company' do
      template.company = nil
      expect(template).to be_invalid
      expect(template.errors[:company]).to include(I18n.t('activerecord.errors.messages.blank'))
    end
  end

  describe '#format_for_editor' do
    it 'depopulates placeholders' do
      
    end
  end
  
  describe '#format_for_storage' do
    it 'populates placeholders' do
      
    end
  end
end
