require 'rails_helper'

RSpec.describe Company, type: :model do
  # pending "add some examples to (or delete) #{__FILE__}"
  required_attributes = { name: 'Acme Corporation', subdomain: 'acme', website: 'http://acme.com' }
  it "is valid with valid attributes" do
    # expect(Company.new).to be_valid
  end
  it "is not valid without a name" do
    company = Company.new(required_attributes.reject { |attr, value| attr == :name })
    expect(company).to_not be_valid
  end
  it "is not valid without a subdomain" do
    company = Company.new(required_attributes.reject { |attr, value| attr == :subdomain })
    expect(company).to_not be_valid
  end
  it "is not valid without a website" do
    company = Company.new(required_attributes.reject { |attr, value| attr == :website })
    expect(company).to_not be_valid
  end
end
