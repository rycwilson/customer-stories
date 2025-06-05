require 'rails_helper'

def sign_in_as user, password = 'password'
  fill_in 'Email', with: user.email
  fill_in 'Password', with: password
  click_button 'Sign in'
end

RSpec.describe 'User authentication', type: :system do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }

  # The let block will be evaluated in the context of the example,
  # e.g. if `company` is already memoized in the example, it will use that instance here.
  let(:user) { create(:user, password: 'password', company: company) }

  it 'allows the user to sign in without a subdomain' do
    visit new_csp_user_session_path
    sign_in_as user
    expect(page).to have_current_path(dashboard_url('curate', subdomain: user.company.subdomain), url: true)
  end

  it "allows the user to sign in to their company's subdomain" do
    visit new_csp_user_session_url(subdomain: company.subdomain)
    sign_in_as user
    expect(page).to have_current_path(dashboard_url('curate', subdomain: user.company.subdomain), url: true)
  end

  it "does not allow the user to sign in to another company's subdomain" do
    visit new_csp_user_session_url(subdomain: other_company.subdomain)
    other_company_host = URI.parse(current_url).host
    sign_in_as user
    expect(page).to have_selector('.bootoast-alert-content', text: "Not authorized for #{other_company_host}")
  end

  it "redirects the user to their company's stories page when signing out" do
    visit new_csp_user_session_path
    sign_in_as user
    find('.user-profile.dropdown').click
    click_link 'Sign out'
    expect(page).to have_current_path(root_url(subdomain: user.company.subdomain), url: true)
  end
end