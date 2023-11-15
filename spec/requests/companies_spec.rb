require 'rails_helper'

RSpec.configure do |config|
  config.include Rails.application.routes.url_helpers, type: :request
end

RSpec.describe "Companies", type: :request do
  let(:company) { create(:company) }
  let(:curator) { create(:curator, company_id: company.id) }

  before { sign_in(curator) }

  describe "Company dashboard" do
    
    it 'GET dashboard' do
      get dashboard_url('curate', subdomain: company.subdomain)
      expect(response).to have_http_status(200)
    end
  end
end