namespace :clicky do

  desc "Clicky Analytics API"

  task download: :environment do

    visitors_list_request = Typhoeus::Request.new(
      GETCLICKY_API_BASE_URL,
      method: :get,
      body: nil,
      params: { site_id: ENV['GETCLICKY_SITE_ID'],
                sitekey: ENV['GETCLICKY_SITE_KEY'],
                type: 'visitors-list',
                date: 'last-1-day',
                limit: 'all',
                output: 'json' },
      headers: { Accept: "application/json" }
    )
    visitors_list_request.run
    visitors_list =
      JSON.parse(visitors_list_request.response.response_body)[0]['dates'][0]['items']
    puts JSON.pretty_generate(visitors_list)
    visitors_list.each do |session|
      company = Company.find_by(subdomain: session['landing_page'].match(/\/\/((\w|-)+)/)[1])
      next if company.nil?
      visitor = Visitor.find_by(clicky_uid: session['uid']) ||
                Visitor.create(clicky_uid: session['uid'],
                               name: session['organization'],
                               location: session['geolocation'],
                               company_id: company.id)
      puts visitor.errors.full_messages
      # create a new VisitorSession
      visitor_session =
        VisitorSession
          .create(timestamp: Time.at(session['time'].to_i),
                  visitor_id: visitor.id,
                  referrer_type: session['referrer_type'].present? ? session['referrer_type'] : nil)
      # create a new VisitorAction, use landing_page to look up company and story
      story_slug = session['landing_page'].slice(session['landing_page'].rindex('/') + 1, session['landing_page'].length)
      success = Story.friendly.exists?(story_slug) ? Story.friendly.find(story_slug).success : nil
      visitor_action = PageView.create(landing: true,
                                       visitor_session_id: visitor_session.id,
                                       success_id: success.try(:id))
      visitor.visitor_sessions << visitor_session
      visitor_session.visitor_actions << visitor_action
    end
  end

end
