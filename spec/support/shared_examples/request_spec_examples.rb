shared_examples 'an html document' do
  it 'loads successfully' do
    expect(response).to be_successful
    expect(response).to have_http_status(:ok)
    expect(response.content_type).to eq('text/html; charset=utf-8')
  end
end

shared_examples 'a json endpoint' do
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

shared_examples 'a redirect to sign-in' do
  it 'redirects to the sign-in page' do
    subdomain = company&.subdomain || ''
    expect(response).to redirect_to(new_user_session_url(subdomain:))
    follow_redirect!
    expect(response).to redirect_to(new_csp_user_session_url(subdomain:))
  end
end