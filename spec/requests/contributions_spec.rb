require 'rails_helper'

RSpec.describe 'Contributions' do
  let(:company) { create(:company) }
  let(:customer) { create(:customer, company:) }
  let(:success) { create(:success, customer:, contributions: create_list(:contribution, 3)) }
  
  shared_examples 'a successful json response' do |path_helper|
    it 'returns a success response as turbo stream' do
      get send(path_helper, company), headers: { 'Accept': 'application/json' } 
      expect(response).to be_successful
      expect(response.media_type).to eq('application/json')
    end
  end

  describe 'GET all contributions' do
    include_examples 'a successful json response', :company_contributions_path
  end

  describe 'GET contributions to a customer win or customer story' do
    include_examples 'a successful json response', :success_contributions_path
  end
  
  it 'GET contributions#new' do
  end

  it 'POST contributions#create' do
  end
end