require 'rails_helper'

RSpec.feature 'Filter stories' do
  def select_has_label(select, text)
    label = find(:label, text:)

    # tom-select is adding '-ts-control' to the label's id. TODO: breaks accessibility?
    label[:for] =~ Regexp.new(select[:id])
  end
  given(:company) { create(:company_with_tags) }
  given(:stories) do 
    create_list(
      :story, 
      3, 
      logo_published: true,   # so it's featured in the stories gallery
      success: create(:success, company: company, story_categories: company.story_categories, products: company.products)
    )
  end
  given(:category_select) do 
    find(:select) { |select| select_has_label(select, 'Category') }
  end
  given(:product_select) do
    find(:select) { |select| select_has_label(select, 'Product') }
  end
  given(:category_option_label) do 
    cat = company.story_categories.first
    "#{cat.name} (#{cat.stories.count})"
  end
  
  background do
    stories   # create the stories

    # TODO: why doesn't root_url use Csp::Application.default_url_options?
    visit root_url(subdomain: company.subdomain, host: Capybara.server_host, port: Capybara.server_port) 
  end
  
  scenario 'Toggle the match type' do
    pending
    fail
  end
  
  scenario 'Select a tag', js: true do
    # page.execute_script("console.log('Hello world')")
    # execute_script("console.log('Hello again!')")
    
    # Need special handling for tom-select inputs...
    # https://github.com/orchidjs/tom-select/discussions/71#discussioncomment-8163539
    fill_in('Category', with: category_option_label, visible: false).send_keys(:return)

    expect(page).to have_css('.story-card', count: 3)
    # expect at least one visible story card
    # expect all visible cards to be tagged with category
    # expect no hidden cards to be tagged with category
    # expect filters to sync
  end


  context 'when matching ANY' do
    scenario 'Select mulitple tags' do
      pending
      fail
    end
  end

  context 'when matching ALL' do
    scenario 'Select mulitple tags' do
      pending
      fail
    end
  end

  scenario 'Clear a filter' do
    pending
    fail
  end

  scenario 'Clear all filters' do
    pending
    fail
  end

  scenario 'Select a tag after searching' do
    pending
    fail
  end
end