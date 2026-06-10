require 'rails_helper'

RSpec.describe "Stories", type: :request do
  let(:story) do 
    create(:story) # { |story| story.category_tags.create(attributes_for(:story_category) }
  end
  let(:company) { story.customer.company }
  let(:curator) { create(:curator, company:) }

  describe "GET /stories" do
    it "works! (now write some real specs)" do
      get stories_index_path
      expect(response).to have_http_status(200)
    end
  end
end
