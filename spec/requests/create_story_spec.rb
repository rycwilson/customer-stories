require 'rails_helper'

RSpec.describe 'Create a Story', type: :request do
  let(:company) { create(:company) }
  let(:curator) { create(:curator, company:) }
  let(:success) { create(:success, company:, customer: create(:customer, company:)) }
  let(:customer) { create(:customer, company: company) }
  let(:customer_win) { create(:success, company: company, customer: customer) }
  let(:story_category) { create(:story_category, company: company) }
  let(:product) { create(:product, company: company) }
  
  before do
    sign_in curator
    host! "#{company.subdomain}.#{ENV.fetch('HOST_NAME', nil)}"
  end

  describe 'POST a new story' do
    context 'with required fields only' do
      let(:valid_attributes) do
        {
          title: 'My Test Story',
          success_attributes: {
            name: 'Success Story',
            customer_id: customer.id,
            curator_id: curator.id
          }
        }
      end
      
      it 'creates a new story and redirects to edit page' do
        expect do
          post(
            company_stories_path(company), 
            params: { story: valid_attributes }, 
            as: :turbo_stream
          )
        end.to change(Story, :count).by(1)
           .and change(Success, :count).by(1)
        
        story = Story.last
        expect(story.title).to eq('My Test Story')
        expect(story.success.name).to eq('Success Story')
        expect(response).to redirect_to(edit_story_path(story))
        expect(response).to have_http_status(:see_other)
      end
    end
    
    context 'with all fields' do
      let(:valid_attributes_with_optional_fields) do
        {
          title: 'Complete Story',
          summary: 'A great customer success story',
          quote: 'This product changed everything for us',
          quote_attr_name: 'John Doe',
          quote_attr_title: 'CTO',
          narrative: 'This is a detailed narrative of the customer success story.',
          success_attributes: {
            name: 'Comprehensive Success Story',
            customer_id: customer.id,
            curator_id: curator.id,
            story_category_ids: [story_category.id],
            product_ids: [product.id]
          },
          results_attributes: [
            { description: 'Increased revenue by 30%' },
            { description: 'Reduced costs by 25%' }
          ]
        }
      end
      
      it 'creates a new story with all fields and redirects to edit page' do
        expect do
          post(
            company_stories_path(company),
            params: { story: valid_attributes_with_optional_fields }, 
            as: :turbo_stream
          )
        end.to change(Story, :count).by(1)
           .and change(Success, :count).by(1)
           .and change(Result, :count).by(2)
        
        story = Story.last
        expect(story.title).to eq('Complete Story')
        expect(story.summary).to eq('A great customer success story')
        expect(story.quote).to eq('This product changed everything for us')
        expect(story.quote_attr_name).to eq('John Doe')
        expect(story.quote_attr_title).to eq('CTO')
        expect(story.results.count).to eq(2)
        expect(story.success.story_categories.count).to eq(1)
        expect(story.success.products.count).to eq(1)
        expect(response).to redirect_to(edit_story_path(story))
        expect(response).to have_http_status(:see_other)
      end
    end
    
    context 'with invalid attributes' do
      let(:invalid_attributes) do
        {
          title: '', # Title is required
          success_attributes: {
            name: 'Invalid Story',
            customer_id: customer.id,
            curator_id: curator.id
          }
        }
      end
      
      it 'does not create a new story and returns errors' do
        expect do
          post(
            company_stories_path(company),
            params: { story: invalid_attributes },
            as: :turbo_stream
          )
        end.to change(Story, :count).by(0)
        
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.body).to include("Story Title is required")
      end
    end
    
    context 'when creating from an existing customer win' do
      let(:valid_success_story_attributes) do
        {
          title: 'Success-based Story',
          narrative: 'This story was created from an existing customer win',
          success_id: success.id
        }
      end
      
      it 'creates a new story linked to the existing customer win' do
        expect do
          post(
            success_story_path(success),
            params: { story: valid_success_story_attributes },
            as: :turbo_stream
          )
        end.to change(Story, :count).by(1)
        
        story = Story.last
        expect(story.title).to eq('Success-based Story')
        expect(story.narrative).to eq('This story was created from an existing customer win')

        # Verify the story is linked to the existing customer win
        expect(story.success_id).to eq(success.id)  
        expect(response).to redirect_to(edit_story_path(story))
        expect(response).to have_http_status(:see_other)
      end
    end
  end
end