require 'rails_helper'

RSpec.configure do |config|
  config.include Rails.application.routes.url_helpers, type: :request
end

RSpec.describe "Companies", type: :request do
  let(:company) do 
    begin
      create(:company)
    rescue ActiveRecord::RecordInvalid => e
      binding.pry
    end
  end
  let(:curator) { create(:curator, company_id: company.id) }
  
  describe 'dashboard' do
    shared_examples 'tab panel' do |path|
      it 'loads successfully' do
        get dashboard_url(path, subdomain: company.subdomain)
        expect(response.content_type).to eq('text/html; charset=utf-8')
        expect(response).to have_http_status(200)
      end
    end

    context 'when curator is signed in' do
      before { sign_in(curator) }

      context('when /prospect') { it_behaves_like 'tab panel', 'prospect' }
      context('when /curate') { it_behaves_like 'tab panel', 'curate' }
      context('when /promote') { it_behaves_like 'tab panel', 'promote' }
      context('when /measure') { it_behaves_like 'tab panel', 'measure' }
    end

    context 'when curator is not signed in' do
      it 'redirects to the sign in page' do
        get dashboard_url('curate', subdomain: company.subdomain)
        expect(response).to redirect_to(new_user_session_url(subdomain: company.subdomain))
      end
    end
  end

  # describe 'Profile' do
  #   subject { get company_settings_url(subdomain: company.subdomain) }
  # end
end