require 'rails_helper'

RSpec.describe 'Companies', type: :request do
  let(:company) do 
    # Exception handling was added as sometimes the company factory will create an invalid subdomain
    begin
      create(:company)
    rescue ActiveRecord::RecordInvalid => _e
      binding.pry
    end
  end
  let(:curator) { create(:curator, company:) }
  let(:other_company) { create(:company) }

  shared_examples 'a dashboard visit' do |path|
    before { get root_url(subdomain: company.subdomain) + path }
    
    it_behaves_like 'an html document'

    it 'loads the dashboard page' do
      expect(response.body).to match(/<title>Customer Stories: Account Dashboard<\/title>/)
    end

    it 'shows the active tab/panel pair' do
      tab_selector = 
        "a[aria-controls=\"#{path}\"][aria-expanded=\"true\"][href=\"##{path}\"][role=\"tab\"]"
      panel_selector = "div[id=\"#{path}\"][class*=\"active\"][role=\"tabpanel\"]"
      # assert_dom([tab_selector, panel_selector]).  
      assert_dom(tab_selector, text: path.capitalize)
      assert_select(panel_selector)
    end
  end

  context 'when user is authenticated' do
    before { sign_in curator }

    %w[curate promote measure].each do |path|
      describe("GET /#{path}") { it_behaves_like 'a dashboard visit', path }
    end

    # Tab navigation on the settings page is handled with page fragments and cookies,
    # so can't test here
    describe('GET /settings') do
      before { get "#{root_url(subdomain: company.subdomain)}settings" }

      it_behaves_like 'an html document'

      it 'loads the account settings page' do
        expect(response.body).to match(/<title>Customer Stories: Account Settings<\/title>/)
      end
    end

    context 'when curator navigates to an invalid subdomain' do
      ['', 'www', 'foobar', nil].each do |subdomain|
        it 'redirects to the company landing page' do
          subdomain ||= other_company.subdomain
          path = %w[curate promote measure settings].sample
          get root_url(subdomain:) + path
          expect(response).to redirect_to(root_url(subdomain: company.subdomain))
        end
      end

      it 'allows a visit to the site landing page' do
        get root_url(subdomain: '')
        expect(response).to be_successful
        expect(response.body).to match(/<title>Customer Stories<\/title>/)
      end
    end
  end

  context 'when user is not authenticated' do
    %w[curate promote measure settings].each do |path|
      describe("GET /#{path}") do
        before { get root_url(subdomain: company.subdomain) + path }
        it_behaves_like 'a redirect to sign-in'
      end
    end
  end
end