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
    visitors_list += get_visitors_range('2017-02-01,2017-02-08')
    visitors_list += get_visitors_range('2017-02-09,2017-02-16')
    visitors_list += get_visitors_range('2017-02-17,2017-02-23')
    visitors_list += get_visitors_range('2017-02-24,2017-02-28')
    visitors_list += get_visitors_range('2017-03-01,2017-03-07')
    visitors_list += get_visitors_range('2017-03-08,2017-03-13')
    visitors_list += get_data_since('visitors', args[:time_offset])
    visitor_sessions = create_sessions(visitors_list)
    create_actions(visitor_sessions)
    destroy_internal_traffic
    Rake::Task["clicky:cache"].invoke
  end

  task update: :environment do
    # for added redundancy and because heroku scheduler is "best effort",
    # we're downloading an hour's worth of data every ten minutes
    visitors_list = get_data_since('visitors', '7200')  # range in seconds relative to now (last hour)
    # ignore most recent 10 minutes at the head
    # visitors_list.slice!(0, visitors_list.index do |session|
    #                           Time.at(session['time'].to_i) < 10.minutes.ago
    #                         end || 0)
    # remove previously captured data at the tail
    visitors_list.slice!(visitors_list.index do |session|
                           session['session_id'] == VisitorSession.last.clicky_session_id
                         end || visitors_list.length, visitors_list.length)
    create_sessions(visitors_list)
    update_actions
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
      # somehow these to default values are different (different numbers for each week
      # in a 30-day span) when the cache is proactively written to here.  so just delete
      # the cache entry instead ...
      Rails.cache.delete("#{company.subdomain}/visitors-chart-default")
      # Rails.cache.write(
      #   "#{company.subdomain}/visitors-chart-default",
      #   company.visitors_chart_json(nil, 30.days.ago.to_date, Date.today)
      # )
      Rails.cache.delete("#{company.subdomain}/referrer-types-default")
      # Rails.cache.write(
      #   "#{company.subdomain}/referrer-types-default",
      #   company.referrer_types_chart_json(nil, 30.days.ago.to_date, Date.today)
      # )
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
      unless (
          # Time.at(session['time'].to_i) > 10.minutes.ago ||
          VisitorSession.exists?(clicky_session_id: session['session_id']) ||
          skip_url?(session['landing_page'], true) )  # true => landing
        company = Company.find_by(subdomain: session['landing_page'].match(/\/\/((\w|-)+)/)[1])
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
          # binding.remote_pry
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
          # first action is already saved landing pageview
          next if index == 0
          create_action(session[:visitor_session_id], action)
        end
      end
    end
  end

  def update_actions
    actions_list = get_data_since('actions', '7200')
    # buffer exists to allow for disparity in the appearance of action/session in the api feed
    # actions_list.slice!(0, actions_list.index do |action|
    #                          Time.at(action['time'].to_i) < VisitorSession.last.timestamp - 20.minutes
    #                        end || 0)
    actions_list
      .group_by { |action| action['session_id'] }
      .each do |session|
        session[1].each do |action|
          unless skip_url?(action['action_url'], false)
            visitor_session = VisitorSession.find_by(clicky_session_id: session[0])
            create_action(visitor_session.id, action.stringify_keys)
          end
        end
      end
  end

  def create_action visitor_session_id, action
    return nil if (
      visitor_session_id.nil? ||
      !['pageview', 'outbound'].include?(action['action_type']) ||
      action_exists?(action) ||
      skip_url?(action['action_url'], false)  # false => not a landing pageview
    )
    if (company = company_index_page?(action['action_url']))
      success = nil
    elsif (success = story_page?(action['action_url']))
      company = success.company
    else
      # it's an outbound action
    end
    new_action = {
      visitor_session_id: visitor_session_id,
      description: action['action_url'],
      timestamp: Time.at(action['time'].to_i)
    }
    if action['action_type'] == 'pageview'
      PageView.create(
        new_action.merge({ success_id: success.try(:id),
                           company_id: company.id })
      )
    elsif action['action_type'] == 'outbound' #&&   # TOO MANY ISSUES
          # adjust cut-off date as necessary
          # Time.at(action['time'].to_i) > Date.strptime('2/12/17', '%m/%d/%y').beginning_of_day
      # success = Story.find_by(title: action['action_title']).try(:success)
      # company = success.try(:company)

      # # linkedin profile
      # if ( contributor = User.find_by(linkedin_url: action['action_url'] ||
      #      contributor = User.find_by(linkedin_url: alt_url(action['action_url'])) )
      #   success
      #   ProfileClick.create(
      #     new_action.merge({ success_id: success.id,
      #                        company_id: company.id,
      #                        description: contributor.linkedin_url })
      #   )
      # # story share
      # elsif action['action_title'].nil? &&
      #       action['action_url'].match(/\/\/(linkedin|twitter|facebook).com/)
      #   # how to find the success??  clicky_custom.outbound_disable
      #   # StoryShare.create(new_action)
      # # CTA
      # elsif ( cta_link = OutboundLink.find_by(link_url: action['action_url']) ||
      #         cta_link = OutboundLink.find_by(link_url: alt_url(action['action_url'])) )
      #   # binding.remote_pry

      #   CtaClick.create(new_action)
      # elsif OutboundLink.exists?(link_url: alt_url)
      #   # binding.remote_pry
      #   new_action[:description] = alt_url
      #   CtaClick.create(new_action)
      # # company logo
      # elsif action['action_url'] == company.website
      #   # binding.remote_pry
      #   LogoClick.create(new_action)
      # elsif alt_url == company.website
      #   # binding.remote_pry
      #   new_action[:description] = alt_url
      #   LogoClick.create(new_action)
      # else
      #   nil
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
    # TODO: This should be modified. Visitors to stories that are subsequently
    #       unpublished will be lost.
    # anyone viewing a story prior to publish date is a curator or developer
    Visitor.joins(:visitor_sessions, :stories)
           .where('stories.published = ? OR stories.publish_date > visitor_sessions.timestamp', false)
           .try(:destroy_all)
    # # Dan and Ryan
    # # (last one on the list is a random visitor who visits A LOT)
    Visitor.joins(:visitor_sessions)
           .where(visitor_sessions: { ip_address: ['50.143.129.107', '24.130.151.80', '24.130.57.16', '50.206.28.66'] })
           .try(:destroy_all)
  end

  def test_company? subdomain
    test_companies = ['cisco', 'acme', 'acme-test']
    test_companies.include?(subdomain)
  end

  # returns the company if action is a company index pageview
  def company_index_page? url
    # www may or may not be present
    Company.find_by(subdomain: url.match(/\/\/((\w|-)+)\.customerstories\.net\/?\z/).try(:[], 1)) ||
    Company.find_by(subdomain: url.match(/\/\/www\.((\w|-)+)\.customerstories\.net\/?\z/).try(:[], 1))
  end

  # returns the success object if action is a story pageview
  def story_page? url
    slug = url.slice(url.rindex('/') + 1, url.length)
    # get rid of trailing / if one exists
    slug.split('').delete_if { |char| char == '/' }.join('')
    Story.friendly.exists?(slug) && Story.friendly.find(slug).success
  end

  def action_exists? action
    VisitorAction.exists?({
      visitor_session_id: VisitorSession.find_by(clicky_session_id: action['session_id']).try(:id),
      timestamp: Time.at(action['time'].to_i)
    })
  end

  def skip_url? url, is_landing
    # www may or may not be present
    domain = url.match(/\/\/www\.((\w|-)+)/).try(:[], 1) ||
             url.match(/\/\/((\w|-)+)/)[1]
    return true if test_company?(domain) ||
                   domain == 'customerstories' ||     # store-front pages
                   url.match(/customerstories.org/)   # staging
    if is_landing
      # must be an index or story page
      !( company_index_page?(url) || story_page?(url) )
    else
      # must be a valid outbound action OR an index or story page
      !( ( company_index_page?(url) || story_page?(url) ) ||      # PageView
         ( User.exists?(linkedin_url: url) ||                     # ProfileClick
           User.exists?(linkedin_url: alt_url(url)) ||
           url.match(/\/\/(linkedin|twitter|facebook).com/) ||    # StoryShare
           OutboundLink.exists?(link_url: url) ||                 # CtaClick
           OutboundLink.exists?(link_url: alt_url(url)) ||
           Company.exists?(website: url) ||                       # LogoClick
           Company.exists?(website: alt_url(url)) ) )
    end
  end

  # inserts a www if not present, or removes www if present
  def alt_url url
    if url.match(/\/\/www\./)
      url.sub!(/www\./, '')
    else
      url.insert(url.index(/\/\//) + 2, 'www.')
    end
  end

end
