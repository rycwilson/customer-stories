namespace :clicky do

  desc "Clicky Analytics API"

  #
  # download history
  # time_offset is seconds since 12/1
  #
  task :init, [:time_offset] => :environment do |task, args|
    Visitor.destroy_all
    visitors_list = get_clicky_visitors_range('2016-05-01,2016-05-31')
    visitors_list += get_clicky_visitors_range('2016-06-01,2016-06-30')
    visitors_list += get_clicky_visitors_range('2016-07-01,2016-07-31')
    visitors_list += get_clicky_visitors_range('2016-08-01,2016-08-31')
    visitors_list += get_clicky_visitors_range('2016-09-01,2016-09-30')
    visitors_list += get_clicky_visitors_range('2016-10-01,2016-10-31')
    visitors_list += get_clicky_visitors_range('2016-11-01,2016-11-30')
    visitors_list += get_clicky_visitors_range('2016-12-01,2016-12-18')
    visitors_list += get_clicky_visitors_since(args[:time_offset])  # seconds since 12/1
    # create visitors and sessions, establish associations
    new_visitor_sessions = parse_clicky_sessions(visitors_list)
    # get actions associated with sessions
    get_clicky_actions(new_visitor_sessions)
    # anyone viewing a story prior to publish date is a curator or CSP staff - remove!
    # TODO: limit this scope to recenty added items
    Visitor.joins(:visitor_sessions, :stories)
           .where('stories.published = ? OR stories.publish_date > visitor_sessions.timestamp', false)
           .destroy_all


  end

  #
  # download last hour's data
  #
  task download: :environment do
    # for added redundancy and because heroku scheduler is "best effort",
    # we're downloading an hour's worth of data every ten minutes
    visitors_list = get_clicky_visitors_since('3600')  # range in seconds relative to now (last hour)
    # remove redundant data
    visitors_list.slice!(
      visitors_list.index do |session|
        session['session_id'] == VisitorSession.last_session.try(:clicky_session_id)
      end || visitors_list.length, visitors_list.length)
    # create visitors and sessions, establish associations
    new_visitor_sessions = parse_clicky_sessions(visitors_list)
    # get actions associated with sessions
    get_clicky_actions(new_visitor_sessions)
    # anyone viewing a story prior to publish date is a curator or CSP staff - remove!
    Visitor.joins(:stories, :visitor_sessions)
           .where('stories.published = ? OR stories.publish_date > visitor_sessions.timestamp', false)
           .destroy_all

    # update cache
    Company.all.each do |company|
      Rails.cache.write(
        "#{company.subdomain}/story-views-activity",
        company.story_views_activity(30)
      )
    end
  end

  def get_clicky_visitors_range range
    visitors_list_request = Typhoeus::Request.new(
      GETCLICKY_API_BASE_URL,
      method: :get,
      body: nil,
      params: { site_id: ENV['GETCLICKY_SITE_ID'],
                sitekey: ENV['GETCLICKY_SITE_KEY'],
                type: 'visitors-list',
                date: range,
                limit: 'all',
                output: 'json' },
      headers: { Accept: "application/json" }
    )
    visitors_list_request.run
    JSON.parse(visitors_list_request.response.response_body)[0]['dates'][0]['items']
  end

  def get_clicky_visitors_since time_offset  # seconds relative to now
    visitors_list_request = Typhoeus::Request.new(
      GETCLICKY_API_BASE_URL,
      method: :get,
      body: nil,
      params: { site_id: ENV['GETCLICKY_SITE_ID'],
                sitekey: ENV['GETCLICKY_SITE_KEY'],
                type: 'visitors-list',
                time_offset: time_offset,
                limit: 'all',
                output: 'json' },
      headers: { Accept: "application/json" }
    )
    visitors_list_request.run
    JSON.parse(visitors_list_request.response.response_body)[0]['dates'][0]['items']
  end

  def parse_clicky_sessions visitors_list
    new_visitor_sessions = []
    visitors_list.each do |session|
      company = Company.find_by(subdomain: session['landing_page'].match(/\/\/((\w|-)+)/)[1])
      story_slug = session['landing_page'].slice(session['landing_page'].rindex('/') + 1, session['landing_page'].length)
      # puts "\ncompany - #{company.name}\n"
      # puts "#{story_slug}"
      next if (company.nil? || company.subdomain == 'cisco' || company.subdomain == 'acme' ||
               company.subdomain == 'acme-test')
      return_visitor = Visitor.find_by(clicky_uid: session['uid'])
      # return_visitor.try(:increment, :total_visits).try(:save)
      visitor = return_visitor || Visitor.create(clicky_uid: session['uid'])
      visitor.update(last_visited: Time.at(session['time'].to_i))
      visitor_session =
        VisitorSession.create(
          timestamp: Time.at(session['time'].to_i),
          visitor_id: visitor.id,
          organization: session['organization'],
          location: session['geolocation'],
          ip_address: session['ip_address'],
          clicky_session_id: session['session_id'],
          referrer_type: session['referrer_type'] || 'direct')
      VisitorSession.last_session = visitor_session
      # create a new VisitorAction, use landing_page to look up story
      success = Story.friendly.exists?(story_slug) ? Story.friendly.find(story_slug).success : nil
      visitor_action = PageView.create(landing: true,
                                       visitor_session_id: visitor_session.id,
                                       success_id: success.try(:id),
                                       company_id: company.id)  # nil if stories index
      # update the associations
      visitor.visitor_sessions << visitor_session
      visitor_session.visitor_actions << visitor_action
      # keep track of these sessions for looking up visitor actions
      new_visitor_sessions << { visitor_session_id: visitor_session.id,
                                clicky_session_id: session['session_id'],
                                actions: session['actions'] }  # number of actions
    end
    new_visitor_sessions
  end

  def get_clicky_actions sessions
    # clicky limits api requests to one per ip address per site id at a time
    hydra = Typhoeus::Hydra.new(max_concurrency: 1)
    sessions.each do |session|
      # don't send request if only the landing action (which was already saved)
      if session[:actions].to_i > 1
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
          next if index == 0  # first action is already saved landing pageview
          company = Company.find_by(subdomain: action['action_url'].match(/\/\/((\w|-)+)/)[1])
          # don't register any page view that's not tied to a company
          if company.present? && action['action_type'] == 'pageview'
            story_title_slug =
              action['action_url'].match(/\/(\w|-)+\/(?=.*-)((\w|-)+)$/).try(:[], 2)
            success_id = story_title_slug.present? && Story.exists?(story_title_slug) ?
                           Story.friendly.find(story_title_slug).success_id : nil
            PageView.create({ success_id: success_id,
                              company_id: company.id,
                              visitor_session_id: session[:visitor_session_id] })
          elsif company.present? && action['action_type'] == 'click'
            StoryShare.create({ success_id: success_id,
                                company_id: company.id,
                                visitor_session_id: session[:visitor_session_id] })
          end
        end
      end
    end  # sessions
  end

end
