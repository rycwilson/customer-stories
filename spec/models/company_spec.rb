require 'rails_helper'

RSpec.describe Company, type: :model do
  before(:context) do
    @reference_company = create(
      :company, 
      name: 'Example Inc.', 
      website: 'https://example.com', 
      subdomain: 'example', 
    )
  end
  after(:context) { @reference_company.destroy }

  subject { build(:company) }

  it 'is valid with valid attributes' do
    expect(subject).to be_valid
  end

  it 'is not valid without a name' do
    subject.name = nil
    expect(subject).not_to be_valid
  end

  it 'is not valid without a unique name' do
    subject.name = @reference_company.name
    expect(subject).not_to be_valid
  end

  it 'is not valid without a subdomain' do
    subject.subdomain = nil
    expect(subject).not_to be_valid
  end

  it 'is not valid without a unique subdomain' do 
    subject.subdomain = @reference_company.subdomain
    expect(subject).not_to be_valid
  end

  it 'is not valid with spaces in the subdomain' do
    subject.subdomain = 'sub domain'
    expect(subject).not_to be_valid
  end

  it 'is not valid when the subdomain starts with a hyphen' do
    subject.subdomain = '-subdomain'
    expect(subject).not_to be_valid
  end

  it 'is not valid when the subdomain ends with a hyphen' do
    subject.subdomain = 'subdomain-'
    expect(subject).not_to be_valid
  end

  it 'is not valid when the subdomain contains consecutive hyphens' do
    subject.subdomain = 'sub--domain'
    expect(subject).not_to be_valid
  end

  it 'is not valid when the subdomain is reserved' do 
    %w(www www1 ftp ftp3 mail mail2 smtp smtp5 pop pop1 imap imap2 ns ns1 ns2).each do |reserved_subdomain|
      subject.subdomain = reserved_subdomain
      expect(subject).not_to be_valid
    end
  end

  it 'is not valid when the subdomain contains a non-alphanumeric character' do
    '!@#$%^&*()+=[]{}|;:,.<>/?_'.split('').each do |non_alphanumeric_char|
      subject.subdomain = "sub#{non_alphanumeric_char}domain"
      expect(subject).not_to be_valid
    end
  end

  it 'is not valid when the subdomain contains a capital letter' do
    subject.subdomain = 'Subdomain'
    expect(subject).not_to be_valid
  end

  it 'is not valid without a subdomain that is between 3 and 63 characters' do
    subject.subdomain = 'a' * 2
    expect(subject).not_to be_valid

    subject.subdomain = 'a' * 64
    expect(subject).not_to be_valid
  end

  it 'is not valid without a website' do
    subject.website = nil
    expect(subject).not_to be_valid
  end


  # it 'is not valid without a website that exists' do
  #   subject.website = 'nowaythiswebsiteexists.com'
  #   expect(subject).not_to be_valid
  # end

  # it 'is not valid without a secure website' do
  #   subject.website = subject.website.sub('https', 'http')
  #   expect(subject).to_not be_valid
  # end

  # it 'has a unique website'
end
