require 'rails_helper'

RSpec.describe Company, type: :model do
  pending 'does some other stuff'
  it 'does even more things'

  subject { described_class.new(name: 'Acme Corporation', subdomain: 'acme', website: 'https://acme.com') }

  it 'is valid with valid attributes' do
    expect(subject).to be_valid
  end

  it 'is unique'
  # will need db test data for this one

  it 'is not valid without a name' do
    subject.name = nil
    expect(subject).to_not be_valid
  end

  it 'is not valid without a subdomain' do
    subject.subdomain = nil
    expect(subject).to_not be_valid
  end

  it 'has a unique subdomain'

  it 'is not valid without proper subdomain format' do
    # test the constraint
  end

  it 'is not valid without a website' do
    subject.website = nil
    expect(subject).to_not be_valid
  end

  it 'is not valid without a website that exists' do
    subject.website = 'nowaythiswebsiteexists.com'
    expect(subject).to_not be_valid
  end

  it 'is not valid without a secure website' do
    subject.website = subject.website.sub('https', 'http')
    expect(subject).to_not be_valid
  end

  it 'has a unique website'
end
