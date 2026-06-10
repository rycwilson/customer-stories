require 'rails_helper'

RSpec.describe 'Companies', type: :request do
  let(:company) do 
    # Exception handling was added as sometimes the company factory will create an invalid subdomain
    begin
      create(:company)
    rescue ActiveRecord::RecordInvalid => e
      binding.pry
    end
  end
  let(:curator) { create(:curator, company:) }

  shared_examples 'html document' do
    it 'loads successfully' do
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to eq('text/html; charset=utf-8')
    end
  end

  shared_examples 'dashboard tab' do |path|
    before { get root_url(subdomain: company.subdomain) + path }
    
    it_behaves_like 'html document'

    it 'loads the dashboard page' do
      expect(response.body).to match(/<title>Customer Stories: Account Dashboard<\/title>/)
    end

    it 'activates the correct tab/panel pair' do
      assert_select(
        "a[aria-controls=\"#{path}\"][aria-expanded=\"true\"][href=\"##{path}\"][role=\"tab\"]",
        text: path.capitalize
      )
      assert_select "div[id=\"#{path}\"][class*=\"active\"][role=\"tabpanel\"]"
    end
  end

  shared_examples 'redirect to sign-in' do |path|
    before { get root_url(subdomain: company.subdomain) + path }

    it 'redirects to the sign in page' do
      default_sign_in_url = new_user_session_url(subdomain: company.subdomain)
      custom_sign_in_url = new_csp_user_session_url(subdomain: company.subdomain)
      expect(response).to redirect_to(default_sign_in_url)
      follow_redirect!
      expect(response).to redirect_to(custom_sign_in_url)
    end
  end

  context 'when user is authenticated' do
    before { sign_in curator }

    %w[curate promote measure].each do |path|
      describe("GET /#{path}") { it_behaves_like 'dashboard tab', path }
    end

    # Tab navigation on the settings page is handled with page fragments and cookies,
    # so can't test here
    describe('GET /settings') do
      before { get "#{root_url(subdomain: company.subdomain)}settings" }

      it_behaves_like 'html document'

      it 'loads the account settings page' do
        expect(response.body).to match(/<title>Customer Stories: Account Settings<\/title>/)
      end
    end
  end

  context 'when user is not authenticated' do
    %w[curate promote measure settings].each do |path|
      describe("GET /#{path}") { it_behaves_like 'redirect to sign-in', path }
    end
  end
end