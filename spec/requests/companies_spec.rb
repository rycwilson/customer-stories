require 'rails_helper'

RSpec.configure do |config|
  config.include Rails.application.routes.url_helpers, type: :request
end

RSpec.describe 'Companies', type: :request do
  let(:company) do 
    begin
      create(:company)
    rescue ActiveRecord::RecordInvalid => e
      binding.pry
    end
  end
  let(:curator) { create(:curator, company_id: company.id) }

  shared_examples 'company document' do |path|
    before { get root_url(subdomain: company.subdomain) + path }

    it 'loads successfully' do
      # get root_url(subdomain: company.subdomain) + path
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to eq('text/html; charset=utf-8')
      expect(response.body).to match(/<title>Customer Stories: Account (Dashboard|Settings)<\/title>/)
    end
  end

  shared_examples 'redirect to auth' do |path|
    it 'redirects to the sign in page' do
      get root_url(subdomain: company.subdomain) + path
      expect(response).to redirect_to(new_csp_user_session_url(subdomain: company.subdomain))
    end
  end

  context 'when curator is signed in' do
    before { sign_in(curator) }

    describe('GET /prospect') { it_behaves_like 'company document', 'prospect' }
    describe('GET /curate') { it_behaves_like 'company document', 'curate' }
    describe('GET /promote') { it_behaves_like 'company document', 'promote' }
    describe('GET /measure') { it_behaves_like 'company document', 'measure' }
    describe('GET /settings') { it_behaves_like 'company document', 'settings' }
  end

  context 'when curator is not signed in' do
    describe('GET /prospect') { it_behaves_like 'redirect to auth', 'prospect' }
    describe('GET /curate') { it_behaves_like 'redirect to auth', 'curate' }
    describe('GET /promote') { it_behaves_like 'redirect to auth', 'promote' }
    describe('GET /measure') { it_behaves_like 'redirect to auth', 'measure' }
    describe('GET /settings') { it_behaves_like 'redirect to auth', 'settings' }
  end
end