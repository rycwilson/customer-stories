require 'rails_helper'

RSpec.feature 'Filter stories' do
  given(:company) { create(:company_with_tags) }
  given(:stories) do 
    create_list(
      :story, 
      3, 
      published: true,
      success: create(:success, company: company, story_categories: company.story_categories, products: company.products)
    )
  end
  given(:category_select) { find(:select, text: 'Category') }
  given(:product_select) { find(:select, text: 'Product') }
  
  background do 
    visit root_url(subdomain: company.subdomain) 
  end

  scenario 'Toggle the match type' do
  end
  
  scenario 'Select a tag', :focus do
    # page.select(company.story_categories.first.name, from: 'Category')
    # expect(page).to have_css('.story-card', count: 3)
    # expect filters to sync
  end

  context 'when matching ANY' do
    scenario 'Select mulitple tags' do
    end
  end

  context 'when matching ALL' do
    scenario 'Select mulitple tags' do
    end
  end

  scenario 'Clear a filter' do
  end

  scenario 'Clear all filters' do
  end

  scenario 'Select a tag after searching' do
  end
end