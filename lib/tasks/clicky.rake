namespace :clicky do

  desc "Clicky Analytics API"

  task download: :environment do

    new_visitor_sessions = []  # unique session ids
    visitors_list = get_clicky_visitors(36000)  # range in seconds relative to now
    # remove any sessions that have already been saved
    visitors_list.slice!(
      visitors_list.index do |session|
        session['session_id'] == VisitorSession.last_recorded.try(:clicky_session_id)
      end || visitors_list.length, visitors_list.length)
    puts "\nVISITORS LIST\n"
    puts JSON.pretty_generate(visitors_list)

    visitors_list.each do |session|
      company = Company.find_by(subdomain: session['landing_page'].match(/\/\/((\w|-)+)/)[1])
      puts "\nCOMPANY FOUND #{ company.subdomain}\n"
      next if company.nil?
      visitor = Visitor.find_by(clicky_uid: session['uid']) ||
                Visitor.create(clicky_uid: session['uid'],
                               name: session['organization'],
                               location: session['geolocation'],
                               company_id: company.id)
      puts "\nERRORS CREATING VISITOR\n"
      puts visitor.errors.full_messages
      visitor_session =
        VisitorSession.create(
          timestamp: Time.at(session['time'].to_i),
          visitor_id: visitor.id,
          clicky_session_id: session['session_id'],
          referrer_type: session['referrer_type'].present? ? session['referrer_type'] : nil)
      # create a new VisitorAction, use landing_page to look up story
      story_slug = session['landing_page'].slice(session['landing_page'].rindex('/') + 1, session['landing_page'].length)
      success = Story.friendly.exists?(story_slug) ? Story.friendly.find(story_slug).success : nil
      visitor_action = StoryView.create(landing: true,
                                       visitor_session_id: visitor_session.id,
                                       success_id: success.try(:id))
      # update the associations
      visitor.visitor_sessions << visitor_session
      visitor_session.visitor_actions << visitor_action
      # keep track of these sessions for looking up visitor actions
      new_visitor_sessions << { visitor_session_id: visitor_session.id,
                                clicky_session_id: session['session_id'],
                                actions: session['actions'] }  # number of actions
    end
    get_clicky_actions(new_visitor_sessions)
  end

  def get_clicky_visitors range  # seconds relative to now
    visitors_list_request = Typhoeus::Request.new(
      GETCLICKY_API_BASE_URL,
      method: :get,
      body: nil,
      params: { site_id: ENV['GETCLICKY_SITE_ID'],
                sitekey: ENV['GETCLICKY_SITE_KEY'],
                type: 'visitors-list',
                time_offset: "#{range}",
                limit: 'all',
                output: 'json' },
      headers: { Accept: "application/json" }
    )
    visitors_list_request.run
    JSON.parse(visitors_list_request.response.response_body)[0]['dates'][0]['items']
  end

  def get_clicky_actions sessions
    # clicky limits api requests to one per ip address per site id at a time
    hydra = Typhoeus::Hydra.new(max_concurrency: 1)
    sessions.each do |session|
      if session[:actions].to_i > 1  # don't send request if only the landing action
        session[:actions_list_request] =
          Typhoeus::Request.new(
            GETCLICKY_API_BASE_URL,
            method: :get,
            body: nil,
            params: { site_id: ENV['GETCLICKY_SITE_ID'],
                      sitekey: ENV['GETCLICKY_SITE_KEY'],
                      type: 'actions-list',
                      session_id: session[:clicky_session_id],
                      output: 'json' },
            headers: { Accept: "application/json" }
          )
        hydra.queue(session[:actions_list_request])
      end
    end
    hydra.run
    sessions.each do |session|
      if session[:actions_list_request]
        actions_list =
          JSON.parse(session[:actions_list_request].response.response_body)[0]['dates'][0]['items']
        actions_list.each_with_index do |action, index|
          next if index == 0  # first action is already recorded landing pageview
          if action['action_type'] == 'pageview'
            story_title_slug = action['action_url'].match(/\/((\w|-)+)$/).try(:[], 1)
            success_id = story_title_slug.present? ?
                           Story.friendly.find(story_title_slug).success_id : nil
            StoryView.create({ success_id: success_id,
                              visitor_session_id: session[:visitor_session_id] })
          elsif action['action_type'] == 'click'
            StoryShare.create({ success_id: success_id,
                               visitor_session_id: session[:visitor_session_id] })
          end
        end
      end
    end  # sessions
  end

end
