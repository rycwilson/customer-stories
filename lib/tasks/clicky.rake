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
    # clicky max date range 31 days, max items 1000
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
    visitors_list += get_visitors_range('2017-02-01,2017-02-07')
    visitors_list += get_data_since('visitors', args[:time_offset])
    visitor_sessions = create_sessions(visitors_list)
    create_actions(visitor_sessions)
    destroy_internal_traffic
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

    # remove previously captured data at the tail
    visitors_list.slice!(visitors_list.index do |session|
                           session['session_id'] == VisitorSession.last.clicky_session_id
                         end, visitors_list.length)
    visitor_sessions = create_sessions(visitors_list)
    update_actions(visitor_sessions)
    destroy_internal_traffic
    Rake::Task["clicky:cache"].invoke
  end

  task cache: :environment do
    Company.all.each do |company|
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

  def create_sessions visitors_list
    visitor_sessions = []
    visitors_list.each do |session|
      if Time.at(session['time'].to_i) < 10.minutes.ago
        domain = session['landing_page'].match(/\/\/((\w|-)+)/)[1]
        company = Company.find_by(subdomain: domain)
        next if company.nil? || test_company?(domain)  # nil if csp landing page
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
        # index or story page?
        if (company = company_index_page?(session['landing_page']))
          success = nil
        elsif (success = story_page?(session['landing_page']))
          company = success.company
        else
          # internal pages
          next
        end
        # create a new VisitorAction for the landing page
        visitor_action = PageView.create(
                           landing: true,
                           timestamp: Time.at(session['time'].to_i),
                           description: session['landing_page'],
                           visitor_session_id: visitor_session.id,
                           success_id: success.try(:id),
                           company_id: company.id )
        # update the associations
        visitor.visitor_sessions << visitor_session
        visitor_session.visitor_actions << visitor_action
        # keep track of these sessions for looking up visitor actions (init task only)
        visitor_sessions << { visitor_session_id: visitor_session.id,
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
          if ['pageview'].include?(action['action_type'])
            create_action(session[:visitor_session_id], action)
          end
        end
      end
    end
  end

  # delay 10 minutes to ensure sessions are in place
  def update_actions sessions
    actions_list = get_data_since('actions', '3600')
    actions_list.slice!(0, actions_list.index do |action|
                             Time.at(action['time'].to_i) > 10.minutes.ago
                           end || 0)
    # in case there are visitor_actions with identical timestamp, look at all of them ...
    last_actions = VisitorAction.where(timestamp: VisitorAction.last.timestamp)
    last_action_index = actions_list.index do |new_action|
                          last_actions.any? do |action|
                            Time.at(new_action['time'].to_i) == action.timestamp &&
                            new_action['session_id'] == action.visitor_session.clicky_session_id &&
                            new_action['action_url'] == action.description
                          end
                        end
    actions_list.slice!(last_action_index || actions_list.length, actions_list.length)
    actions_list
      .group_by { |action| action['session_id'] }
      .each do |session|
        visitor_session = VisitorSession.find_by(clicky_session_id: session[0])
        session[1].each do |action|
          if ['pageview'].include?(action[:action_type]) && !action_exists?(action)
              visitor_session.visitor_actions <<
                create_action(visitor_session.id, action.stringify_keys)
          end
        end
      end
  end

  # outbound actions: action will be appended with ' csp-outbound-logo'
  # (or csp-outbound-cta-link, csp-outbound-cta-form, csp-outbound-profile, etc)

  # make sure outbound actions are captured

  def create_action visitor_session_id, action
    action_domain = action['action_url'].match(/\/\/((\w|-)+)/)[1]
    if action_domain == 'customerstories' || test_company?(action_domain)
      return nil
    elsif (company = company_index_page?(action['action_url']))
      success = nil
    elsif (success = story_page?(action['action_url']))
      company = success.company
    else
      return nil
    end
    new_action = {
      success_id: success.try(:id),
      company_id: company.id,
      visitor_session_id: visitor_session_id,
      description: action['action_url'],
      timestamp: Time.at(action['time'].to_i)
    }
    if action['action_type'] == 'pageview'
      PageView.create(new_action)
    # elsif action['action_type'] == 'outbound' &&
    #       # adjust cut-off date as necessary
    #       Time.at(action['time'].to_i) > Date.strptime('2/6/17', '%m/%d/%y')
    #   # what's up with this comig up nil???
    #   success_id = Story.find_by(title: action['action_title']).success.id
    #   if success_id.nil?
    #     puts action
    #   end
    #   # linkedin profile
    #   if action['action_url'].match(/linkedin\z/)
    #     ProfileClick.create(new_action.merge({ success_id: success_id }))
    #   # story share
    #   elsif [LINKEDIN_SHARE_URL, TWITTER_SHARE_URL, FACEBOOK_SHARE_URL].include?(action['action_url'])
    #     StoryShare.create(new_action.merge({ success_id: success_id }))
    #   # company logo
    #   elsif action['action_url'].match(/logo\z/)
    #     LogoClick.create(new_action.merge({ success_id: success_id }))
    #   # CTA
    #   elsif action['action_url'].match(/cta\z/)
    #     CtaClick.create(new_action.merge({ success_id: success_id }))
    #   else
    #     # capture these
      # end
    end
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

  # TODO: limit the scope to recently added items
  def destroy_internal_traffic
    # anyone viewing a story prior to publish date is a curator or developer
    Visitor.joins(:visitor_sessions, :stories)
           .where('stories.published = ? OR stories.publish_date > visitor_sessions.timestamp', false)
           .try(:destroy_all)
    # Dev traffic
    Visitor.joins(:visitor_actions)
           .where(visitor_actions: { company_id: 1 } )  # acme-test
           .try(:destroy_all)
    # Dan and Ryan
    Visitor.joins(:visitor_sessions)
           .where(visitor_sessions: { ip_address: ['50.143.129.107', '24.130.151.80', '24.130.57.16'] })
           .try(:destroy_all)
  end

  def test_company? subdomain
    test_companies = ['cisco', 'acme', 'acme-test']
    test_companies.include?(subdomain)
  end

  # returns the company if action is a company index pageview
  def company_index_page? url
    Company.find_by(subdomain: url.match(/\/\/((\w|-)+).customerstories.(net|org)\/?\z/).try(:[], 1))
  end

  # returns the success object if action is a story pageview
  def story_page? url
    slug = url.slice(url.rindex('/') + 1, url.length)
    Story.friendly.exists?(slug) && Story.friendly.find(slug).success
  end

  def action_exists? action
    VisitorAction.exists?({
      visitor_session_id: VisitorSession.find_by(clicky_session_id: action[:session_id]).try(:id),
      timestamp: Time.at(action[:time].to_i)
    })
  end

end
