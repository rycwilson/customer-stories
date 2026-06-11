require 'rails_helper'

RSpec.describe 'Contributions', type: :request do
  let(:company) { create(:company) }
  let(:curator) { create(:curator, company:) }
  let(:customer) { create(:customer, company:) }
  let(:success) { create(:success, customer:) }

  before do
    # host! "#{company.subdomain}.lvh.me"
    sign_in curator
  end

  describe 'GET /contributions' do  
    before do 
      get(
        company_contributions_url(company, subdomain: company.subdomain),
        headers: { Accept: 'application/json' }
      )
    end
    it_behaves_like 'a json response'
  end

  describe 'GET /successes/:success_id/contributions' do
    before do 
      get(
        success_contributions_url(success, subdomain: company.subdomain),
        headers: { Accept: 'application/json' }
      )
    end
    it_behaves_like 'a json response'
  end
  
  it 'GET contributions#new' do
    skip
  end

  it 'POST contributions#create' do
    skip
  end
end