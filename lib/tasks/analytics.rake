
namespace :analytics do
  desc "fetch getclicky data"
  task get_data: :environment do
    request = Typhoeus::Request.new(
      GETCLICKY_API_BASE_URL,
      method: :get,
      body: nil,
      params: { site_id: ENV['GETCLICKY_SITE_ID'],
                sitekey: ENV['GETCLICKY_SITE_KEY'],
                type: 'visitors',
                output: 'json' },
      headers: { Accept: "application/json" }
    )
    request.run
  end
end