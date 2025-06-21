require 'rails_helper'

RSpec.describe Company, type: :model do
  subject(:company) { build(:company) }

  it { is_expected.to be_valid }

  describe 'validation' do
    let(:existing_company) { create(:company) }

    it 'requires a name' do
      company.name = nil
      expect(company).to be_invalid
      expect(company.errors[:name]).to include(I18n.t('activerecord.errors.messages.blank'))
    end
  
    it 'requires a unique name' do
      company.name = existing_company.name
      expect(company).to be_invalid
      expect(company.errors[:name]).to include(I18n.t('errors.messages.taken'))
    end
  
    it 'requires a subdomain' do
      company.subdomain = nil
      expect(company).to be_invalid
      expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.blank'))
    end
  
    it 'requires a unique subdomain' do 
      company.subdomain = existing_company.subdomain
      expect(company).to be_invalid
      expect(company.errors[:subdomain]).to include(I18n.t('errors.messages.taken'))
    end
  
    it 'is not valid with spaces in the subdomain' do
      company.subdomain = 'sub domain'
      expect(company).to be_invalid
      expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.invalid_format'))
    end
  
    it 'is not valid when the subdomain starts with a hyphen' do
      company.subdomain = '-subdomain'
      expect(company).to be_invalid
      expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.invalid_format'))
    end
  
    it 'is not valid when the subdomain ends with a hyphen' do
      company.subdomain = 'subdomain-'
      expect(company).to be_invalid
      expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.invalid_format'))
    end
  
    it 'is not valid when the subdomain contains consecutive hyphens' do
      company.subdomain = 'sub--domain'
      expect(company).to be_invalid
      expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.not_allowed'))
    end
  
    it 'is not valid when the subdomain is reserved' do 
      %w(www www1 ftp ftp3 mail mail2 smtp smtp5 pop pop1 imap imap2 ns ns1 ns2).each do |reserved_subdomain|
        company.subdomain = reserved_subdomain
        expect(company).to be_invalid
        expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.not_allowed'))
      end
    end
  
    it 'is not valid when the subdomain contains a non-alphanumeric character' do
      '!@#$%^&*()+=[]{}|;:,.<>/?_'.split('').each do |non_alphanumeric_char|
        company.subdomain = "sub#{non_alphanumeric_char}domain"
        expect(company).to be_invalid
        expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.invalid_format'))
      end
    end
  
    it 'is not valid when the subdomain contains a capital letter' do
      company.subdomain = 'Subdomain'
      expect(company).to be_invalid
      expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.invalid_format'))
    end
  
    it 'is not valid when the subdomain is too short' do
      company.subdomain = 'a' * 2
      expect(company).to be_invalid
      expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.invalid_format'))
    end
  
    it 'is not valid when the subdomain is too long' do
      company.subdomain = 'a' * 64
      expect(company).to be_invalid
      expect(company.errors[:subdomain]).to include(I18n.t('activerecord.errors.messages.invalid_format'))
    end

  
    # it 'is not valid without a website' do
    #   company.website = nil
    #   expect(company).not_to be_valid
    # end
  
  
    # it 'is not valid without a website that exists' do
    #   company.website = 'nowaythiswebsiteexists.com'
    #   expect(company).not_to be_valid
    # end
  
    # it 'is not valid without a secure website' do
    #   company.website = company.website.sub('https', 'http')
    #   expect(company).to_not be_valid
    # end
  
    # it 'has a unique website'
  end

  # describe 'associations' do
  #   it { is_expected.to have_many(:users) }
  #   it { is_expected.to have_many(:curators).class_name('User')}
  #   it { is_expected.to have_many(:customers).dependent(:destroy) } 
  #   it { is_expected.to have_many(:successes).through(:customers) }
  #   it { is_expected.to have_many(:stories).through(:successes) }
  #   it { is_expected.to have_many(:contributions).through(:successes) }
  #   it { is_expected.to have_many(:contributors).through(:customers) }
  #   it { is_expected.to have_many(:invitation_templates) }
  #   it { is_expected.to have_many(:ctas).class_name('CallToAction')}
  #   it { is_expected.to have_many(:adwords_images).dependent(:destroy) }
  #   it { is_expected.to have_one(:plugin).dependent(:destroy) }

  #   it { is_expected.to accept_nested_attributes_for(:adwords_images).allow_destroy(true) }
  # end

end
