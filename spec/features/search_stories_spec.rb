require 'rails_helper'

RSpec.feature 'Search stories' do
  given(:company) { create(:company) }
  given(:stories) do 
    create_list(:story, 3, success: create(:success, company: company))
  end
  
  background do 
    visit root_url(subdomain: company.subdomain) 
  end
  
  scenario 'Submit search text' do
    pending('awaiting test implementation')
    fail
  end
end