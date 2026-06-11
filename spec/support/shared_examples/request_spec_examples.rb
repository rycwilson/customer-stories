shared_examples 'an html response' do
  it 'returns the html (document or turbo-frame)' do
    expect(response).to be_successful
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq('text/html')
  end
end

shared_examples 'a json response' do
  it 'returns a valid json object' do
    expect(response).to be_successful
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq('application/json')
    expect { JSON.parse(response.body) }.not_to raise_error

    # For a more specific check of the shape of data... 
    # parsed_response = JSON.parse(response.body)
    # expect(parsed_response).to be_a(Hash) # or Array, String, etc. depending on expected shape
    # expect(parsed_response.fetch('data')).to all(be_a(Hash))
  end
end

shared_examples 'a turbo frame response' do |frame_id:|
  it_behaves_like 'an html response'

  it 'returns a turbo frame with the expected id' do
    assert_dom "turbo-frame##{frame_id}", count: 1

    # The turbo-frame tag should be the only content of the response body
    fragment = Nokogiri::HTML.fragment(response.body)
    top_level_elements = fragment.children.select(&:element?)
    expect(top_level_elements.size).to eq(1)

    frame = top_level_elements.first
    expect(frame.name).to eq('turbo-frame')
    expect(frame['id']).to eq(frame_id)
  end
end

shared_examples 'a turbo stream response' do
  it 'returns a turbo stream' do
    expect(response).to be_successful
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq('text/vnd.turbo-stream.html')
    expect(response.body).to include('turbo-stream')
  end
end

shared_examples 'a redirect to sign-in' do
  it 'redirects to the sign-in page' do
    subdomain = company&.subdomain || ''
    expect(response).to redirect_to(new_user_session_url(subdomain:))
    follow_redirect!
    expect(response).to redirect_to(new_csp_user_session_url(subdomain:))
  end
end