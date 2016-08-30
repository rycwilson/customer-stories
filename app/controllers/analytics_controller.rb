class AnalyticsController < ApplicationController

  def create
    # request = Typhoeus::Request.new(
    #   GETCLICKY_TRACKING_URL,
    #   method: :get,
    #   body: nil,
    #   params: { site_id: ENV['GETCLICKY_SITE_ID'],
    #             sitekey: ENV['GETCLICKY_SITE_KEY'],
    #             type: 'visitors-list',
    #             data: 'last-7-days',
    #             output: 'json' },
    #   headers: { Accept: "application/json" }
    # )
    # request.run
  end

end
