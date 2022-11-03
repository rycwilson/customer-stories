require 'rails_helper'

RSpec.describe Company, type: :model do
  # pending "add some examples to (or delete) #{__FILE__}"
  it "is valid with valid attributes"
    expect(Company.new).to be_valid
  it "is not valid without a name"
  it "is not valid without  a subdomain"
  it "is not valid without a website"
end
