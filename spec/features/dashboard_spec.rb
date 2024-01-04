require 'rails_helper'

RSpec.configure do |config|
  config.include Rails.application.routes.url_helpers, type: :feature
end

# RSpec.describe 'Dashboard', type: :feature do
RSpec.feature 'Dashboard' do
  let(:company) { create(:company) }
  let(:curator) { create(:curator, company_id: company.id) }

  describe 'tab interface' do
    before { sign_in(curator) }

    scenario 'active tab follows the URL path' do
      %w(prospect curate promote measure).each do |path|
        visit root_url(subdomain: company.subdomain) + path
        expect(page).to have_css("li.active > a[href='##{path}']")
        expect(page).to have_css("##{path}.tab-pane.active")
      end
    end
  end
end