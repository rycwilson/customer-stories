namespace :clicky do

  desc "Clicky Analytics API"

  #
  # download history
  # time_offset is seconds since start of today
  #
  task :init, [:time_offset] => :environment do |task, args|
  # task init: :environment do
    Visitor.destroy_all
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE visitors_id_seq RESTART WITH 1')
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE visitor_sessions_id_seq RESTART WITH 1')
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE visitor_actions_id_seq RESTART WITH 1')
    visitors_list = get_visitors_range('2016-05-01,2016-05-31')
    visitors_list += get_visitors_range('2016-06-01,2016-06-30')
    visitors_list += get_visitors_range('2016-07-01,2016-07-31')
    visitors_list += get_visitors_range('2016-08-01,2016-08-31')
    visitors_list += get_visitors_range('2016-09-01,2016-09-30')
    visitors_list += get_visitors_range('2016-10-01,2016-10-31')
    visitors_list += get_visitors_range('2016-11-01,2016-11-30')
    visitors_list += get_visitors_range('2016-12-01,2016-12-15')
    visitors_list += get_visitors_range('2016-12-16,2016-12-31')
    visitors_list += get_visitors_range('2017-01-01,2017-01-14')
    visitors_list += get_visitors_range('2017-01-15,2017-01-22')
    visitors_list += get_visitors_range('2017-01-23,2017-01-31')
    visitors_list += get_visitors_range('2017-02-01,2017-02-03')
    visitors_list += get_data_since('visitors', args[:time_offset])
    # create sessions and visitors, set associations
    visitor_sessions = create_sessions(visitors_list)
    # create actions, set associations
    create_actions(visitor_sessions)
    # remove curator and developer data
    destroy_internal_traffic
    # update cache
    Rake::Task["clicky:cache"].invoke
  end

  task update: :environment do
    # for added redundancy and because heroku scheduler is "best effort",
    # we're downloading an hour's worth of data every ten minutes
    visitors_list = get_data_since('visitors', '3600')  # range in seconds relative to now (last hour)
    # ignore most recent 10 minutes at the head
    visitors_list.slice!(0, visitors_list.index do |session|
                              Time.at(session['time'].to_i) > 10.minutes.ago
                            end || 0)
    # remove redundant data at the tail
    visitors_list.slice!(
      visitors_list.index do |session|
        session['session_id'] == VisitorSession.last_session.try(:clicky_session_id)
      end || visitors_list.length, visitors_list.length)
    # create sessions and visitors, set associations
    visitor_sessions = create_sessions(visitors_list)
    # get latest actions
    update_actions(visitor_sessions)
    # remove curator and developer data
    destroy_internal_traffic
    # update cache
    Rake::Task["clicky:cache"].invoke
  end

  task cache: :environment do
    Company.all.each do |company|
      unless company.subdomain == 'zoommarketing'
        ActionController::Base.new.expire_fragment("#{company.subdomain}/recent-activity")
        Rails.cache.write(
          "#{company.subdomain}/recent-activity",
          company.recent_activity(30)
        )
        Rails.cache.write(
          "#{company.subdomain}/visitors-chart-default",
          company.visitors_chart_json(nil, 30.days.ago.to_date, Date.today)
        )
        Rails.cache.write(
          "#{company.subdomain}/referrer-types-default",
          company.referrer_types_chart_json(nil, 30.days.ago.to_date, Date.today)
        )
        Rails.cache.write(
          "#{company.subdomain}/stories-table",
          company.stories_table_json
        )
        Rails.cache.write(
          "#{company.subdomain}/visitors-table-default",
          company.visitors_table_json(nil, 30.days.ago.to_date, Date.today)
        )
      end
    end
  end

  def create_sessions visitors_list
    visitor_sessions = []
    visitors_list.each do |session|

      if Time.at(session['time'].to_i) < 10.minutes.ago

        company = Company.find_by(subdomain: session['landing_page'].match(/\/\/((\w|-)+)/)[1])
        story_slug = session['landing_page'].slice(session['landing_page'].rindex('/') + 1, session['landing_page'].length)
        # if landing page is a csp landing page, company will be nil
        next if (company.nil? || company.subdomain == 'cisco' || company.subdomain == 'acme' ||
                 company.subdomain == 'acme-test')
        return_visitor = Visitor.find_by(clicky_uid: session['uid'])
        visitor = return_visitor || Visitor.create(clicky_uid: session['uid'])
        referrer_type = session['referrer_type'] || 'direct'
        referrer_type = 'promote' if referrer_type == 'advertising'
        referrer_type = 'link' if referrer_type == 'email'
        visitor_session =
          VisitorSession.create(
            timestamp: Time.at(session['time'].to_i),
            visitor_id: visitor.id,
            organization: session['organization'],
            location: session['geolocation'],
            ip_address: session['ip_address'],
            clicky_session_id: session['session_id'],
            referrer_type: referrer_type)
        VisitorSession.last_session = visitor_session
        # create a new VisitorAction, use landing_page to look up story
        success = Story.friendly.exists?(story_slug) ? Story.friendly.find(story_slug).success : nil
        visitor_action = PageView.create(
                           landing: true,
                           timestamp: Time.at(session['time'].to_i),
                           visitor_session_id: visitor_session.id,
                           success_id: success.try(:id),  # nil if stories index
                           company_id: company.id )
        VisitorAction.last_action = visitor_action
        # update the associations
        visitor.visitor_sessions << visitor_session
        visitor_session.visitor_actions << visitor_action
        # keep track of these sessions for looking up visitor actions (init task only)
        visitor_sessions << { company_id: company.id,
                              visitor_session_id: visitor_session.id,
                              clicky_session_id: session['session_id'],
                              actions: session['actions'] }  # number of actions
      end

    end
    visitor_sessions
  end

  def create_actions sessions
    # clicky limits api requests to one per ip address per site id at a time
    hydra = Typhoeus::Hydra.new(max_concurrency: 1)
    sessions.each do |session|
      # don't send request if only the landing action (which was already saved)
      if session[:actions].to_i > 1
        session[:actions_request] = request_actions_session(session)
        hydra.queue(session[:actions_request])
      end
    end
    hydra.run
    sessions.each do |session|
      if session[:actions_request]
        actions_list =
          JSON.parse(session[:actions_request].response.response_body)[0]['dates'][0]['items']
        actions_list.each_with_index do |action, index|
          next if index == 0  # first action is already saved landing pageview
          create_action(session, action)
        end
      end
    end
  end

  def update_actions sessions
    VisitorAction.last_action ||= VisitorAction.order(:timestamp, :created_at).last
    actions_list = get_data_since('actions', '3600')
    # ignore most recent 10 minutes at the head
    actions_list.slice!(0, actions_list.index do |action|
                             Time.at(action['time'].to_i) > 10.minutes.ago
                           end || 0)
    last_action_index = actions_list.index do |action|
                          Time.at(action['time'].to_i) == VisitorAction.last_action.timestamp &&
                          action['session_id'] == VisitorAction.last_action.visitor_session.clicky_session_id &&
                          action['action_url'] == VisitorAction.last_action.description
                        end
    actions_list.slice!(last_action_index || actions_list.length, actions_list.length)
    # binding.remote_pry
    # actions_list.each do |action|

    # end

  end

  def create_action session, action
    new_action = {
      company_id: session[:company_id],
      visitor_session_id: session[:visitor_session_id],
      description: action['action_url'],
      timestamp: Time.at(action['time'].to_i)
    }
    if action['action_type'] == 'pageview'
      story_title_slug = action['action_url'].match(/\/(\w|-)+\/(?=.*-)((\w|-)+)$/).try(:[], 2)
      success_id = story_title_slug.present? && Story.exists?(story_title_slug) ?
                     Story.friendly.find(story_title_slug).success_id : nil
      VisitorAction.last_action =
        PageView.create(new_action.merge({ success_id: success_id }))

    elsif action['action_type'] == 'outbound' &&
          # adjust cut-off date as necessary
          Time.at(action['time'].to_i) > Date.strptime('2/5/17', '%m/%d/%y')
      new_action.merge({
        success_id: Story.find_by(title: action['action_title']).tr
      })
      # linkedin profile
      if action['action_url'].match(/linkedin\z/)
        VisitorAction.last_action = ProfileClick.create(new_action)
      # story share
      elsif [LINKEDIN_SHARE_URL, TWITTER_SHARE_URL, FACEBOOK_SHARE_URL].include?(action['action_url'])
        VisitorAction.last_action = StoryShare.create(new_action)
      # company logo
      elsif action['action_url'].match(/logo\z/)
        VisitorAction.last_action = LogoClick.create(new_action)
      # CTA
      elsif action['action_url'].match(/cta\z/)
        VisitorAction.last_action = CtaClick.create(new_action)
      end
    end
  end

  def request_actions_session session
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
  end

  def get_visitors_range range
    request = Typhoeus::Request.new(
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
    request.run
    JSON.parse(request.response.response_body)[0]['dates'][0]['items']
  end

  def get_data_since type, time_offset  # seconds ago
    request = Typhoeus::Request.new(
      GETCLICKY_API_BASE_URL,
      method: :get,
      body: nil,
      params: { site_id: ENV['GETCLICKY_SITE_ID'],
                sitekey: ENV['GETCLICKY_SITE_KEY'],
                type: type == 'visitors' ? 'visitors-list' : 'actions-list',
                time_offset: time_offset,
                limit: 'all',
                output: 'json' },
      headers: { Accept: "application/json" }
    )
    request.run
    JSON.parse(request.response.response_body)[0]['dates'][0]['items']
  end

  def destroy_internal_traffic
    # anyone viewing a story prior to publish date is a curator or CSP staff - remove!
    # TODO: limit this scope to recenty added items
    Visitor.joins(:visitor_sessions, :stories)
           .where('stories.published = ? OR stories.publish_date > visitor_sessions.timestamp', false)
           .destroy_all
    # Ryan
    Visitor.joins(:visitor_actions)
           .where(visitor_actions: { company_id: 1 } )  # acme-test
           .try(:destroy_all)
    Visitor.find_by(clicky_uid: 6314802).try(:destroy)
    Visitor.find_by(clicky_uid: 1888001310).try(:destroy)
    Visitor.find_by(clicky_uid: 2953643240).try(:destroy)   # safari
    Visitor.find_by(clicky_uid: 1446025430).try(:destroy)   # safari
  end

end
