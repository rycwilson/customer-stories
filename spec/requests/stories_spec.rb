require 'rails_helper'

RSpec.describe 'Stories', type: :request do
  # let(:story) do 
  #   create(:story) # { |story| story.category_tags.create(attributes_for(:story_category) }
  # end
  let(:company) { create(:company) }
  let(:curator) { create(:curator, company:) }
  let(:success) { create(:success, curator:) }

  # This will add the company subdomain to paths passed to calls to `get` below,
  # but will not affect calls to path helpers (e.g. `new_company_story_path`) since those are generated 
  # with the test host, which does not include the subdomain. 
  # So, for example, `get new_company_story_path(company), as: :turbo_stream` will generate a request to 
  # `http://test.host/companies/:company_id/stories/new` rather than 
  # `http://:company_subdomain.test.host/companies/:company_id/stories/new`. 
  # To work around this, we can use the `host!` method to set the test session's host to include the 
  # subdomain, which will allow path helpers to generate URLs with the subdomain as expected.
  before { host! "#{company.subdomain}.#{ENV.fetch('HOST_NAME', nil)}" }

  describe 'GET /' do
    context 'when visiting the company landing page' do
      before { get root_path }

      it_behaves_like 'an html response'

      it 'loads the company landing page' do
        expect(response.body).to match(
          %r{<title>#{Regexp.escape(company.name)} Customer Stories</title>}
        )
        assert_select('body.stories.index')
      end
    end
    
    context 'when loading a turbo frame in the dashboard' do
      before do 
        sign_in curator

        get root_path, headers: { 'Turbo-Frame' => 'stories' }
      end

      it_behaves_like 'a turbo frame response', frame_id: 'stories'
    end
  end

  describe 'GET a new story form' do
    before { sign_in curator }
    
    context 'when there is a Customer Win' do
      before { get new_success_story_path(success), as: :turbo_stream }

      it_behaves_like 'a turbo stream response'

      # This is too js heavy. Use system spec instead
      # it 'renders the new story form in a modal' { ... }
    end
    
    context 'when there is not a Customer Win' do
      before { get new_company_story_path(company), as: :turbo_stream }

      it_behaves_like 'a turbo stream response'
    end
  end 

  # describe 'GET /stories.json' do
  # end
end
