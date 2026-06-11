require 'rails_helper'

RSpec.describe 'Stories', type: :request do
  # let(:story) do 
  #   create(:story) # { |story| story.category_tags.create(attributes_for(:story_category) }
  # end
  let(:success) { create(:success) }
  # let(:curator) { create(:curator, company: success.company) }

  describe 'GET /' do
    context 'when visiting the company landing page' do
      before { get root_url(subdomain: success.company.subdomain) }
      it_behaves_like 'an html response'
    end
    
    context 'when loading a turbo frame in the dashboard' do
      before do 
        sign_in success.curator
        get(
          root_url(subdomain: success.company.subdomain),
          headers: { 'Turbo-Frame' => 'stories' }
        )
      end
      it_behaves_like 'a turbo frame response', frame_id: 'stories'
    end
  end

  # describe 'GET a new story form' do
  #   before { sign_in success.curator }
    
  #   context 'when there is a Customer Win' do
  #     get new_success_story_url(
  #       success,
  #       subdomain: company.subdomain,
  #       headers: { 'Accept': 'text/vnd.turbo-stream.html' }
  #     )
  #     it_behaves_like 'a turbo stream response'
  #   end
    
  #   context 'when there is not a Customer Win' do
  #     get new_company_story_url(
  #       success.company,
  #       subdomain: company.subdomain,
  #       headers: { 'Accept': 'text/vnd.turbo-stream.html' }
  #     )
  #     it_behaves_like 'a turbo stream response'
  #   end
  # end 

  describe 'GET /stories.json' do
  end
end
