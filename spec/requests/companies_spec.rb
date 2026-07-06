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

  before do 
    host! "#{company.subdomain}.#{ENV.fetch('HOST_NAME', nil)}"
  end

  shared_examples 'a dashboard visit' do |path|
    before { get dashboard_path(path) }
    
    it_behaves_like 'an html response'

    it 'loads the dashboard page' do
      assert_select('title', text: 'Customer Stories: Account Dashboard')
      assert_select('body.companies.show')
    end

    it 'shows the active tab/panel pair' do
      tab_selector = 
        "a[aria-controls=\"#{path}\"][aria-expanded=\"true\"][href=\"##{path}\"][role=\"tab\"]"
      panel_selector = "div[id=\"#{path}\"][class*=\"active\"][role=\"tabpanel\"]"
      assert_select(tab_selector, path.capitalize)
      assert_select(panel_selector)
    end
  end

  context 'when the user is authenticated' do
    before { sign_in curator }

    %w[curate promote measure].each do |path|
      describe("GET /#{path}") { it_behaves_like 'a dashboard visit', path }
    end

    # Tab navigation on the settings page is handled with page fragments and cookies, 
    # so can't test here.
    describe('GET /settings') do
      before { get edit_company_path }

      it_behaves_like 'an html response'
  
      it 'loads the account settings page' do
        expect(response.body).to match(/<title>Customer Stories: Account Settings<\/title>/)
      end
    end

    context 'when the user navigates outside their company subdomain' do
      ['', 'www', 'foobar', nil].each do |subdomain|
        subdomain_desc = if subdomain.present?
                           subdomain
                         else
                           (subdomain.nil? ? 'other registered account' : 'none')
                         end
        it "redirects subdomain (#{subdomain_desc}) from dashboard to company landing" do
          subdomain ||= other_company.subdomain
          %w[curate promote measure].each do |path|
            get dashboard_url(path, subdomain:)
            expect(response).to redirect_to(root_url(subdomain: company.subdomain))
          end
        end

        it "redirects subdomain (#{subdomain_desc}) from settings to company landing" do
          subdomain ||= other_company.subdomain
          get edit_company_url(subdomain:)
          expect(response).to redirect_to(root_url(subdomain: company.subdomain))
        end
      end

      it 'lets a signed in user visit the site landing pages' do
        get root_url(subdomain: '')
        expect(response).to be_successful
        expect(response.body).to match(/<title>Customer Stories<\/title>/)
      end
    end
  end

  context 'when user is not authenticated' do
    %w[curate promote measure settings].each do |path|
      describe("GET /#{path}") do
        before { get root_path + path }
        it_behaves_like 'a redirect to sign-in'
      end
    end
  end
end