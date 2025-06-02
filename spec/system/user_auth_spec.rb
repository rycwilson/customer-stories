require 'rails_helper'

def sign_in_as user, password = 'password'
  fill_in 'Email', with: user.email
  fill_in 'Password', with: password
  click_button 'Sign in'
end

RSpec.describe 'User authentication', type: :system do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:user) { create(:user, password: 'password', company_id: company.id) }

  it 'allows a user to sign in without subdomain' do
    visit new_csp_user_session_path
    sign_in_as user
    expect(page).to have_current_path(dashboard_url('curate', subdomain: user.company.subdomain), url: true)

    # Log out
    # click_link 'Logout'

    # Expect to see a successful logout message or login page
    # expect(page).to have_content('Signed out successfully').or have_content('Log in')
  end

  it 'allows a user to sign in with subdomain' do
    skip 'not yet'
  end

  it "does not allow a user to sign in to another company's subdomain" do
    visit new_csp_user_session_url(subdomain: other_company.subdomain)
    sign_in_as user
    expect(page).to have_content("Not authorized for #{URI.parse(current_url).host}")
  end
end