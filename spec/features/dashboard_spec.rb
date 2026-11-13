require 'rails_helper'

RSpec.configure do |config|
  config.include Rails.application.routes.url_helpers, type: :feature
end

# RSpec.describe 'Dashboard', type: :feature do
RSpec.feature 'Dashboard' do
  # let(:company) { create(:company) }
  # let(:curator) { create(:curator, company_id: company.id) }
  # before { sign_in(curator) }

  given(:company) { create(:company) }
  given(:curator) { create(:curator, company_id: company.id) }
  background { sign_in(curator) }

  # it 'active tab follows the URL path' do
  scenario 'active tab follows the URL path' do
    %w(curate promote measure).each do |path|
      visit root_url(subdomain: company.subdomain) + path
      expect(page).to have_css("li.active > a[href='##{path}']")
      expect(page).to have_css("##{path}.tab-pane.active")
    end
  end

  scenario 'Prospect path redirects to Curate' do
    visit root_url(subdomain: company.subdomain) + 'prospect'
    expect(page).to have_current_path('/curate')
  end

  scenario 'Curate has sub-panels for stories, contributions and customer wins' do
    visit root_url(subdomain: company.subdomain) + 'curate'

    expect(page).not_to have_css('#prospect')
    expect(page).not_to have_css('.search-and-filters')
    expect(page).to have_css('#curate > .company__container .sidebar')

    panel_ids = all('#curate .company__main > .tab-content > .tab-pane').map { |panel| panel[:id] }
    expect(panel_ids).to eq(%w[customer-stories contributions customer-wins])

    tab_labels = all('#curate .sidebar [role=tab]').map(&:text)
    expect(tab_labels).to eq(['Customer Stories', 'Contributors', 'Customer Wins'])
  end

  scenario 'Customer stories panel has table controls with search and a filters button' do
    visit root_url(subdomain: company.subdomain) + 'curate'

    within('#stories') do
      expect(page).to have_css('.table-controls form.search-stories')
      expect(page).to have_css('.table-controls button[aria-label=Filters]')
      expect(page).not_to have_css('[data-controller~=table-nav]')
      expect(page).to have_css('turbo-frame#stories', visible: :all)
    end
  end
end
