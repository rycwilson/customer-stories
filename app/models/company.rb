class Company < ApplicationRecord

  # include GoogleAds

  before_validation :smart_add_url_protocol

  validates :name, presence: true, uniqueness: true
  validates :subdomain, presence: true, uniqueness: true, subdomain: true
  validates :website, presence: true, uniqueness: true, website: true
  validates_associated :adwords_images

  has_many :users # no dependent: :destroy users, handle more gracefully

  has_many :customers, dependent: :destroy do
    # def select_options(with_result_count: false)
    #   order(:name).map { |customer| [ with_result_count ? "#{customer.name} (#{self.count})" : customer.name, customer.id ] }
    # end
  end
  has_many :successes, -> { includes(:story) }, through: :customers do
    def select_options
      self.map do |success|
        [ success.name, success.id ]
      end
      .unshift( [""] )  # empty option makes placeholder possible (only needed for single select)
    end
  end

  has_many :curators, class_name: "User" do
    def select_options
      order(:last_name).map { |curator| [ curator.full_name, curator.id ] }
      # self.sort_by { |c| c.last_name }.map { |curator| [ curator.full_name, curator.id ] }
    end
  end
  has_many :contributions, -> { includes(:contributor, :referrer, success: { customer: {} }) }, through: :successes
  has_many :contributors, -> { distinct }, through: :customers
  has_many :referrers, -> { distinct }, through: :contributions
  has_many :stories, through: :successes do
    def select_options
      self.published
          .map { |story| [ story.title, story.id ] }
          .unshift( ['All', 0] )
    end
    def plugin_select_options
      options = {}
      where('logo_published = ? OR preview_published = ?', true, true)
        .each do |story|
          option_data = [ 
            story.title, "#{story.id}", { data: { customer: story.customer.name.to_json } } 
          ]
          if options.has_key?(story.customer.name)
            options[story.customer.name] << option_data
          else
            options.merge!({ story.customer.name => [ option_data ] })
          end
        end
      options
    end
    def with_ads
      self.select do |story|
        story.published? && story.topic_ad.present? && story.retarget_ad.present?
      end
      .sort_by { |story| story.publish_date || DateTime.now }.reverse
    end
  end
  has_many :visitor_actions
  has_many :page_views, class_name: "PageView"
  has_many :story_shares, class_name: "StoryShare"
  has_many :cta_clicks, class_name: "CtaClick"
  has_many :profile_clicks, class_name: "ProfileClick"
  has_many :logo_clicks, class_name: "LogoClick"
  # include the select clause with extra fields,
  # because these models have a default search order on those fields,
  # so must be included in the select clause
  has_many :visitor_sessions, -> { select('visitor_sessions.*, visitor_sessions.clicky_session_id, visitor_actions.timestamp').distinct }, through: :visitor_actions
  has_many :visitors, -> { select('visitors.*, visitor_sessions.clicky_session_id, visitor_actions.timestamp').distinct }, through: :visitor_sessions
  has_many :story_categories, dependent: :destroy do
    def select_options(only_featured=false, for_multi_select=false)
      (only_featured ? self.featured : self).map do |category| 
        [category.name, for_multi_select ? "category-#{category.id}" : category.id, { data: { slug: category.slug } }]
      end.sort
    end
  end
  accepts_nested_attributes_for :story_categories, allow_destroy: true
  has_many :categories, class_name: 'StoryCategory'  # alias
  has_many :products, dependent: :destroy do
    def select_options(only_featured=false, for_multi_select=false)
      (only_featured ? self.featured : self).map do |product| 
        [product.name, for_multi_select ? "product-#{product.id}" : product.id, { data: { slug: product.slug } }]
      end.sort
    end
  end
  accepts_nested_attributes_for :products, allow_destroy: true
  has_many :contributor_questions, dependent: :destroy do
    def customer
      where(role: 'customer')
    end
    def customer_success ()
      where(role: 'customer_success')
    end
    def sales
      where(role: 'sales')
    end
    def grouped_select_options
      {
        'Custom' => self.select { |q| q.role.nil? }
                        .map { |q| [q.question, q.id] }
                        .unshift( ['- New Question -', '0'] ),
        'Customer' => self.select { |q| q.role == 'customer' }
                          .map { |q| [q.question, q.id] },
        'Customer Success' => self.select { |q| q.role == 'customer success' }
                                  .map { |q| [q.question, q.id] },
        'Sales' => self.select { |q| q.role == 'sales' }
                       .map { |q| [q.question, q.id] },
      }
    end
    # method formats grouped options for js select2 initialization
    def grouped_select2_options (template)
      [
        {
          text: 'Custom',
          children: self.select { |q| q.role.nil? }
                        .map do |q|
                          {
                            id: q.id, text: q.question,
                            disabled: template.contributor_questions.any? do |ques|
                                        ques.id == q.id
                                      end
                          }
                        end
                        .unshift({ id: 0, text: '- New question -' })
        },
        {
          text: 'Customer',
          children: self.select { |q| q.role == 'customer' }
                        .map do |q|
                          {
                            id: q.id, text: q.question,
                            disabled: template.contributor_questions.any? do |ques|
                                        ques.id == q.id
                                      end
                          }
                        end
        },
        {
          text: 'Customer Success',
          children: self.select { |q| q.role == 'customer success' }
                        .map do |q|
                          {
                            id: q.id, text: q.question,
                            disabled: template.contributor_questions.any? do |ques|
                                        ques.id == q.id
                                      end
                          }
                        end
        },
        {
          text: 'Sales',
          children: self.select { |q| q.role == 'sales' }
                        .map do |q|
                          {
                            id: q.id, text: q.question,
                            disabled: template.contributor_questions.any? do |ques|
                                        ques.id == q.id
                                      end
                          }
                        end
        }
      ]
    end
  end
  alias_attribute :questions, :contributor_questions
  has_many :invitation_templates, dependent: :destroy do
    def customer
      where(name: 'Customer').take
    end
    def customer_success
      where(name: 'Customer Success').take
    end
    def sales
      where(name: 'Sales').take
    end
    def select_options
      self.sort_by { |t| t.name }.map { |template| [ template.name, template.id ] }
    end
    def grouped_select_options
      {
        'Custom' => self.where.not("name IN ('Customer', 'Customer Success', 'Sales')")
                        .map { |template| [template.name, template.id] }
                        .unshift( ['- New template -', '0'] ) ,
        'Defaults' => self.where("name IN ('Customer', 'Customer Success', 'Sales')")
                          .map { |template| [template.name, template.id] }
      }
    end
    def grouped_select2_options
      [
        {
          text: 'Custom',
          children: self.where.not("name IN ('Customer', 'Customer Success', 'Sales')")
                        .map do |template| { id: template.id, text: template.name }
                        end
                        .unshift({ id: 0, text: '- New template -' })
        },
        {
          text: 'Defaults',
          children: self.where("name IN ('Customer', 'Customer Success', 'Sales')")
                        .map { |template| { id: template.id, text: template.name } }
        }
      ]
    end
  end
  alias_attribute :templates, :invitation_templates
  has_many :outbound_actions, dependent: :destroy
  has_many(:ctas, class_name: 'CallToAction', dependent: :destroy) do
    def primary
      where(primary: true).take
    end
  end
  accepts_nested_attributes_for :ctas
  has_one :plugin, dependent: :destroy
  has_many :adwords_campaigns, dependent: :destroy
  alias_attribute :campaigns, :adwords_campaigns
  has_one :topic_campaign, dependent: :destroy
  has_one :retarget_campaign, dependent: :destroy

  has_many :adwords_ad_groups, through: :adwords_campaigns
  alias_attribute :ad_groups, :adwords_ad_groups
  has_one :topic_ad_group, through: :topic_campaign, source: :adwords_ad_group
  has_one :retarget_ad_group, through: :retarget_campaign, source: :adwords_ad_group

  has_many :adwords_ads, through: :adwords_campaigns do
    def with_google_id
      where.not(ad_id: [nil])  # don't include emptry string or it won't work! (because type is number?)
    end
  end
  alias_attribute :ads, :adwords_ads

  has_many :adwords_images, dependent: :destroy
  alias_attribute :ad_images, :adwords_images
  accepts_nested_attributes_for :adwords_images, allow_destroy: true

  after_update_commit do 
    square_logo_was_updated = previous_changes.keys.include?('square_logo_url') and previous_changes[:square_logo_url].first.present?
    landscape_logo_was_updated = previous_changes.keys.include?('landscape_logo_url') and previous_changes[:landscape_logo_url].first.present?
    if square_logo_was_updated
      S3Util.delete_object(S3_BUCKET, previous_changes[:square_logo_url].first)
    end
    if landscape_logo_was_updated
      S3Util.delete_object(S3_BUCKET, previous_changes[:landscape_logo_url].first)
    end
    # adwords_logo_was_updated = previous_changes.keys.include?('adwords_logo_url') && previous_changes[:adwords_logo_url].first.present?
    # if adwords_logo_was_updated
    #   S3Util.delete_object(S3_BUCKET, previous_changes[:adwords_logo_url].first)
    # end
  end

  after_commit(on: [:create], unless: -> { skip_callbacks }) do
    self.create_plugin

    # default invitation templates (formerly email templates, futurely invitation templates)
    Company.find_by(name: 'CSP').invitation_templates.each do |factory_template|
      if ['Customer', 'Customer Success', 'Sales'].include?(factory_template.name)
        company_template = factory_template.dup
        self.invitation_templates << company_template
        factory_template.contributor_questions.each do |factory_question|
          if factory_question.role.present?
            new_question = factory_question.dup
            self.contributor_questions << new_question
            company_template.contributor_questions << new_question
          end
        end
        company_template.save
      end
    end
  end

  # virtual attributes
  attr_writer :default_ad_image_url
  attr_accessor :skip_callbacks

  def tag_select_options tag_type, with_stories_count: true, only_featured: false, for_multi_select: false
    tags = send(tag_type.to_s.pluralize) if [:category, :product].include?(tag_type)
    return [] if tags.blank?
    (only_featured ? tags.featured : tags).map do |tag| 
      [
        with_stories_count ? "#{tag.name} (#{(only_featured ? tag.stories.featured : tag.stories).count})" : tag.name,
        for_multi_select ? "#{tag_type}-#{tag.id}" : tag.id, 
        { data: { slug: tag.slug } }
      ]
    end.sort_by do |(text, id)| 
      with_stories_count ? text.match(/\((?<count>\d+)\)/)[:count].to_i : text
    end
    .send(with_stories_count ? :reverse : :itself)      
  end

  def published_stories
    Story.default_order(Story.company_published(self.id)).pluck(:id)
  end

  def published_stories_filter_category category_id
    Story.default_order(Story.company_published_filter_category(self.id, category_id)).pluck(:id)
  end

  def published_stories_filter_product product_id
    Story.default_order(Story.company_published_filter_product(self.id, product_id)).pluck(:id)
  end

  def public_stories
    story_ids = Story.default_order(Story.company_public(self.id)).pluck(:id)
    Story.where(id: story_ids).order_as_specified(id: story_ids)
  end

  def public_stories_filter_category (category_id)

    story_ids = Story.default_order(Story.company_public_filter_category(self.id, category_id)).pluck(:id)
    Story.where(id: story_ids).order_as_specified(id: story_ids)
  end

  def public_stories_filter_product (product_id)
    story_ids = Story.default_order(Story.company_public_filter_product(self.id, product_id)).pluck(:id)
    Story.where(id: story_ids).order_as_specified(id: story_ids)
  end

  # def get_gads(campaign=nil)
  #   if campaign == 'topic'
  #     GoogleAds::get_ads([ self.topic_campaign.ad_group.ad_group_id ])
  #   elsif campaign == 'retarget'
  #     GoogleAds::get_ads([ self.retarget_campaign.ad_group.ad_group_id ])
  #   else
  #     GoogleAds::get_ads(self.ad_groups.pluck(:id))
  #   end
  # end

  # TODO: faster? http://stackoverflow.com/questions/20014292
  def filter_stories(filter_params)
    story_ids = []
    if filter_params.empty?
      self.public_stories
    else
      if filter_params['category'].present?
        story_ids.concat(self.public_stories_filter_category(filter_params['category']))
      end
      if filter_params['product'].present?
        story_ids.concat(self.public_stories_filter_product(filter_params['product']))
      end
      Story.where(id: story_ids).order_as_specified(id: story_ids)
    end
  end

  def curator? current_user=nil
    return false if current_user.nil?
    current_user.company_id == self.id
  end

  # this is used for validating the company's website address
  # see lib/website_validator.rb
  def smart_add_url_protocol
    return false if self.website.blank?
    unless self.website[/\Ahttp:\/\//] || self.website[/\Ahttps:\/\//]
      self.website = "http://#{self.website}"
    end
  end

  def missing_info
    missing = []
    missing << "logo" unless self.logo_url.present?
    missing << "story_categories" unless self.story_categories.present?
    missing << "products" unless self.products.present?
    missing
  end

  def products_jsonld
    self.products.map do |product|
                    { "@type" => "Product",
                      "name" => product.name }
                  end
  end

  def latest_story_publish_date
    self.stories.where(published: true).order(:publish_date).take.try(:publish_date)
  end

  def latest_story_modified_date
    self.stories.where(logo_published: true).order(logo_publish_date: :desc).take.try(:logo_publish_date)
  end

  def recent_activity days_offset  # today = 0
    # story_shares = self.story_shares(days_offset)
    groups = [
      { label: 'Story views',
        story_views: self.story_views_activity(7) },
      { label: 'Stories published',
        stories_published: self.stories_published_activity(days_offset) },
      { label: 'Contributions submitted',
        contributions_submitted: self.contribution_submissions_activity(days_offset) },
      { label: 'Contribution requests received',
        contribution_requests_received: self.contribution_requests_received_activity(days_offset) },
      { label: 'Logos published',
        stories_logo_published: self.stories_logo_published_activity(days_offset) },
      { label: 'Stories created',
        stories_created: self.stories_created_activity(days_offset) }
    ]
    # move any groups with no entries to the end of the array
    groups.length.times do
      if groups.any? { |group| group.values[1].length == 0 }
        groups.insert(groups.length - 1, groups.delete_at(groups.find_index { |group| group.values[1].length == 0 }))
      end
    end
    groups
  end

  def stories_created_activity days_offset
    Story
      .company_all_created_since(self.id, days_offset)
      .order(created_at: :desc)
      .map do |story|
        { type: 'Stories created',
          story: JSON.parse(
                    story.to_json({
                      only: [:title],
                      methods: [:csp_edit_story_path],
                      include: {
                        success: {
                          only: [],
                          include: { customer: { only: [:name] },
                                     curator: { only: [], methods: :full_name } }}}
                    })),
          timestamp: story.created_at.to_s }
      end
  end

  def stories_logo_published_activity days_offset
    Story
      .company_public_since(self.id, days_offset)
      .order(logo_publish_date: :desc)
      .map do |story|
        { type: 'Logos published',
          story: JSON.parse(
                    story.to_json({
                      only: [:title, :published],
                      methods: [:csp_edit_story_path],
                      include: {
                        success: {
                          only: [],
                          include: { customer: { only: [:name] },
                                     curator: { methods: :full_name } }}}
                    })),
          timestamp: story.logo_publish_date.to_s }
      end
      .delete_if { |story| story[:story]['published'] }
  end

  def contribution_requests_received_activity days_offset
    Contribution
      .company_requests_received_since(self.id, days_offset)
      .order(request_received_at: :desc)
      .map do |contribution|
        { type: 'Contribution requests received',
          contribution: JSON.parse(
                    contribution.to_json({
                       only: [:status, :request_received_at],
                       include: {
                         contributor: { only: [], # only need full name
                                        methods: :full_name },
                         success: {
                           only: [], # only need story and customer
                           include: {
                             story: { only: :title, methods: :csp_edit_story_path },
                             customer: { only: [:name] } }}}
                    })),
          timestamp: contribution.request_received_at.to_s }
      end
      .delete_if { |event| event[:contribution]['status'] == 'contribution' }
  end

  def contribution_submissions_activity days_offset
    Contribution
      .company_submissions_since(self.id, days_offset)
      .order(submitted_at: :desc)
      .map do |contribution|
        { type: 'Contributions submitted',
          contribution: JSON.parse(
                    contribution.to_json({
                      only: [:status, :contribution, :feedback, :submitted_at],
                      include: {
                      contributor: { only: [], # only need full name
                                     methods: :full_name },
                      success: { only: [], # only need story and customer
                                include: { story: { only: :title,
                                                    methods: :csp_edit_story_path },
                                           customer: { only: [:name] } }}}
                    })),
          timestamp: contribution.submitted_at.to_s }
      end
  end

  def stories_published_activity days_offset
    Story
      .company_published_since(self.id, days_offset)
      .order(publish_date: :desc)
      .map do |story|
        { type: 'Stories published',
          story: JSON.parse(
                   story.to_json({
                     only: [:title],
                     methods: [:csp_story_path],
                     include: {
                       success: {
                         only: [],
                         include: { customer: { only: [:name] },
                                    curator: { methods: :full_name } }}}
                   })),
          timestamp: story.publish_date.to_s }
      end
  end


  def story_views_activity days_offset
    PageView
      .joins(:visitor_session)
      .company_story_views_since(self.id, days_offset)
      .order('visitor_sessions.timestamp desc')
      .map do |story_view|
        { type: 'Story views',
          story_view: JSON.parse(
                        story_view.to_json({
                          only: [],
                          include: {
                            success: {
                              only: [],
                              include: {
                                story: {
                                  only: [:title],
                                  methods: [:csp_story_path] },
                                customer: {
                                  only: [:name] }}},
                            visitor_session: {
                              only: [:organization, :location, :referrer_type] }}
                        })),
          timestamp: story_view.visitor_session.timestamp.to_s }
      end
  end

  def story_shares_activity days_offset
  end

  def stories_table_json
    company_page_views = self.page_views.count
    # timestamp must be included since there's a default scope that orders on timestamp
    # note that it doesn't actually appear in the output
    logo_page_visitors = PageView.joins(:visitor)
                           .where(company_id: self.id, success_id: nil)
                           .group('visitor_actions.timestamp, visitors.id').count
    logo_page =
      [ '', 'Logo Page', '', logo_page_visitors.length,
        ((PageView.company_index_views(self.id).count.to_f / company_page_views.to_f) * 100).round(1).to_s + '%' ]
    PageView.distinct
      .joins(:story, :visitor, success: { customer: {} })
      .where(company_id: self.id, stories: { published: true })
      .group('visitor_actions.timestamp, stories.title', 'stories.publish_date', 'visitors.id', 'customers.name')
      .count
      .group_by { |story_visitor_timestamp, visits| story_visitor_timestamp[0] }
      .to_a.map do |story|
        visitors = Set.new
        publish_date = nil
        customer = nil
        story[1].each do |visitor|
          visitors << visitor[0][2]
          publish_date ||= visitor[0][1]
          customer ||= visitor[0][3]
        end
        [ customer, story[0], publish_date.strftime('%-m/%-d/%y'), visitors.count,
          ((Story.find_by(title: story[0]).page_views.count.to_f / company_page_views.to_f) * 100).round(1).to_s + '%' ]
      end
      .push(logo_page)
      .sort_by { |story| story[3] || 0 }.reverse
  end

  def visitors_chart_json story = nil, start_date = 30.days.ago.to_date, end_date = Date.today
    if story.nil?
      visitor_actions_conditions = { company_id: self.id }
    else
      visitor_actions_conditions = { company_id: self.id, success_id: story.success.id }
    end
    num_days = (start_date..end_date).count
    if num_days < 21
      visitors = VisitorSession.distinct
        .includes(:visitor)
        .joins(:visitor_actions)
        .where(visitor_actions: visitor_actions_conditions)
        .where('visitor_sessions.timestamp > ? AND visitor_sessions.timestamp < ?',
               start_date.beginning_of_day, end_date.end_of_day)
        .group_by { |session| session.timestamp.to_date }
        .sort_by { |date, sessions| date }.to_h
        .map do |date, sessions|
          [ date.strftime('%-m/%-d/%y'), sessions.map { |session| session.visitor }.uniq.count ]
        end
        if start_date == end_date || visitors.empty?
          visitors
        else
          visitors = fill_daily_gaps(visitors, start_date, end_date)
        end
    elsif num_days < 120
      # TODO: Perform the count without actually loading any objects
      visitors = VisitorSession.distinct
        .includes(:visitor)
        .joins(:visitor_actions)
        .where(visitor_actions: visitor_actions_conditions)
        .where('visitor_sessions.timestamp > ? AND visitor_sessions.timestamp < ?',
               start_date.beginning_of_week.beginning_of_day, end_date.end_of_week.end_of_day)
        .group_by { |session| session.timestamp.to_date.beginning_of_week }
        .sort_by { |date, sessions| date }.to_h
        .map do |date, sessions|
          [ date.strftime('%-m/%-d/%y'),
            sessions.map { |session| session.visitor }.uniq.count ]
        end
      if visitors.empty?
        visitors
      else
        visitors = fill_weekly_gaps(visitors, start_date, end_date)
      end
    else
      visitors = VisitorSession.distinct
        .includes(:visitor)
        .joins(:visitor_actions)
        .where(visitor_actions: visitor_actions_conditions)
        .where('visitor_sessions.timestamp >= ? AND visitor_sessions.timestamp <= ?',
               start_date.beginning_of_month.beginning_of_day, end_date.end_of_month.end_of_day)
        .group_by { |session| session.timestamp.to_date.beginning_of_month }
        .sort_by { |date, sessions| date }.to_h
        .map do |date, sessions|
          [ date.strftime('%-m/%y'),
            sessions.map { |session| session.visitor }.uniq.count ]
        end
      visitors
      # if visitors.empty?
      #   visitors
      # else
      #   visitors = fill_monthly_gaps(visitors, start_date, end_date)
      # end
    end
  end

  def visitors_table_json story = nil, start_date = 30.days.ago.to_date, end_date = Date.today
    if story.nil?
      visitor_actions_conditions = { company_id: self.id }
    else
      visitor_actions_conditions = { company_id: self.id, success_id: story.success.id }
    end
    # keep track of stories viewed by a given org, to be used for looking up story titles
    success_list = Set.new
    # note that visitor_sessions.timestamp and visitor_actions.timestamp must appear
    # in the group clause because of the default scope (order) on these tables
    # by including these in a single string argument,
    # only the organization, visitors.id, and visitor_actions.success_id are returned
    visitors = VisitorSession.distinct.joins(:visitor, :visitor_actions)
      .where('visitor_sessions.timestamp >= ? AND visitor_sessions.timestamp <= ?',
              start_date.beginning_of_day, end_date.end_of_day)
      .where(visitor_actions: visitor_actions_conditions)
      .group('visitor_sessions.clicky_session_id, visitor_actions.timestamp, organization', 'visitors.id', 'visitor_actions.success_id')
      .count
      .group_by { |org_visitor_success, count| org_visitor_success[0] }
      .to_a.map do |org|
        org_visitors = Set.new
        org_successes = []  # => [ [ success_id, unique visitors = [] ] ]
        org[1].each do |org_visitor_success|
          visitor_id = org_visitor_success[0][1]
          success_id = org_visitor_success[0][2]
          org_visitors << visitor_id
          if (index = org_successes.find_index { |success| success[0] == success_id })
            org_successes[index][1] << visitor_id
          else
            success_list << success_id
            org_successes << [ success_id, [ visitor_id ] ]
          end
        end
        org_successes.map! { |success| [ success[0], success[1].count ] }
        [ '', org[0] || '', org_visitors.count, org_successes ]
      end
      .sort_by { |org| org[1] }  # sort by org name
      # create a lookup table { success_id: story title }
      success_list.delete_if { |success_id| success_id.nil? }
      success_story_titles =
        Success.find(success_list.to_a).map { |success| [ success.id, success.story.try(:title) ] }.to_h
      visitors.each do |org|
        org[3].map! { |success| [ success_story_titles[success[0]] || 'Logo Page', success[1] ] }
              .sort_by! { |story| story[1] }.reverse!
      end
  end

  def referrer_types_chart_json story = nil, start_date = 30.days.ago.to_date, end_date = Date.today
    if story.nil?
      visitor_actions_conditions = { company_id: self.id }
    else
      visitor_actions_conditions = { company_id: self.id, success_id: story.success.id }
    end
    VisitorSession
      .select(:referrer_type)
      .joins(:visitor_actions)
      .where(visitor_actions: visitor_actions_conditions)
      .where('visitor_sessions.timestamp > ? AND visitor_sessions.timestamp < ?',
             start_date.beginning_of_day, end_date.end_of_day)
      .group_by { |session| session.referrer_type }
      .map { |type, records| [type, records.count] }
  end

  def actions_table_json story = nil, start_date = 30.days.ago.to_date, end_date = Date.today
    if story.nil?
      visitor_actions_conditions = { company_id: self.id }
    else
      visitor_actions_conditions = { company_id: self.id, success_id: story.success.id }
    end
    VisitorAction.distinct
      .joins(:visitor_session, :visitor)
      .where(visitor_actions_conditions)
      .where('visitor_actions.timestamp > ? AND visitor_actions.timestamp < ?',
             start_date.beginning_of_day, end_date.end_of_day)
      .group_by('visitor_actions.timestamp, visitor_actions.description', 'visitors.id' )
      .count
  end

  # when scheduling, make sure this doesn't collide with clicky:update
  # possible to check on run status of rake task?
  def send_analytics_update
    visitors = visitors_chart_json
    total_visitors = 0
    visitors.each { |group| total_visitors += group[1] }
    # columns as days or weeks?
    # xDelta is the difference in days between adjacent columns
    if visitors.length == 1  # 1 day
      xDelta = 0;
    elsif visitors.length > 1
      xDelta = (visitors[1][0].to_date - visitors[0][0].to_date).to_i
      xDelta += 365 if xDelta < 0  # account for ranges that span new year
    end
    if xDelta <= 1
      axesLabels = ['Day', 'Visitors']
    elsif xDelta === 7
      axesLabels = ['Week starting', 'Visitors'];
    else
      axesLabels = ['Month', 'Visitors'];
    end
    # don't bother applying axes labels if there is no data ...
    # visitors.unshift(axesLabels) if visitors.length > 0

    # referrer_types = visitors_chart_json
    {
      visitors: Gchart.bar({
                  data: visitors
                  # title: "Unique Visitors - #{total_visitors}"
                  # hAxis: { title: axesLabels[0] }
                  # vAxis: { title: axesLabels[1], minValue: 0 }
                  # legend: { position: 'none' }
                }),
      referrer_types: nil
    }

  end

  def gads_requirements_checklist
    # {
    #   promote_enabled: self.promote_tr?,
    #   default_headline: self.adwords_short_headline.present?,
    #   square_image: self.adwords_images.square_images.default.present?,
    #   landscape_image: self.adwords_images.landscape_images.default.present?,
    #   valid_defaults: GoogleAds::get_image_assets(
    #       self.adwords_images.default.map { |image| image.asset_id }
    #     ).try(:length) == self.adwords_images.default.length
    # }
  end

  def ready_for_gads?
    self.gads_requirements_checklist.values.all? { |value| value }
  end

  def set_reset_gads
    return false if !self.promote_tr?



    # find campaigns and ad groups, make sure they match csp data, create/modify as necessary

    # self.remove_all_gads

    # better: iterate through gads data
    # => remove any ad that does not contain a story id label that corresponds to a published story
    # => leave ads alone if they match (but how to tell? not all fields returned)

  end

  # returns ids and names only
  # {
  #   topic: {
  #     name: 'varmour display topic'
  #     campaign_id: 1,
  #     ad_group_id: 1
  #   },
  #   retarget: {
  #     name: 'varmour display retarget'
  #     campaign_id: 1,
  #     ad_group_id: 1
  #   }
  # }
  def google_ads_meta_data
    data = { topic: {}, retarget: {} }
    # campaigns = GoogleAds::get_campaigns([ nil, nil ], self.subdomain)
    # [:topic, :retarget].each do |campaign_type|
    #   campaign = campaigns.try(:select) { |c| c[:name].match("display #{ campaign_type }") }.try(:first)
    #   data[campaign_type][:name] = campaign.try(:[], :name)
    #   data[campaign_type][:campaign_id] = campaign.try(:[], :id)
    #   if campaign.present?
    #     ad_group = GoogleAds::get_ad_groups([ data[campaign_type][:campaign_id] ]).try(:first)
    #     data[campaign_type][:ad_group_id] = ad_group.try(:[], :id)
    #   end
    # end
    # # puts data
    # return data
  end

  def sync_gads_campaigns
    gads_meta_data = self.google_ads_meta_data
    if gads_meta_data[:topic][:campaign_id] != self.topic_campaign.campaign_id
      self.topic_campaign.update(
        name: gads_meta_data[:topic][:name],
        campaign_id: gads_meta_data[:topic][:campaign_id]
      )
    end
    if gads_meta_data[:topic][:ad_group_id] != self.topic_ad_group.ad_group_id
      self.topic_ad_group.update(
        ad_group_id: gads_meta_data[:topic][:ad_group_id]
      )
    end
    if gads_meta_data[:retarget][:campaign_id] != self.retarget_campaign.campaign_id
      self.retarget_campaign.update(
        name: gads_meta_data[:retarget][:name],
        campaign_id: gads_meta_data[:retarget][:campaign_id]
      )
    end
    if gads_meta_data[:retarget][:ad_group_id] != self.retarget_ad_group.ad_group_id
      self.retarget_ad_group.update(
        ad_group_id: gads_meta_data[:retarget][:ad_group_id]
      )
    end
  end

  # def google_campaigns(only_ids)
  #   campaigns = GoogleAds::get_campaigns(
  #     [ self.topic_campaign.try(:campaign_id), self.retarget_campaign.try(:campaign_id) ],
  #     self.subdomain
  #   )
  #   # pp campaigns
  #   {
  #     topic: campaigns.try(:select) { |c| c[:name].match('display topic') }.try(:first),
  #     retarget: campaigns.try(:select) { |c| c[:name].match('display retarget') }.try(:first),
  #   }
  # end

  # if bypassing csp data and getting everything from google (as when setting/resetting),
  # explicit campaign ids can be provided; otherwise look up via csp campaign data
  # def google_ad_groups(topic_campaign_id=nil, retarget_campaign_id=nil)
  #   ad_groups = GoogleAds::get_ad_groups(
  #     [
  #       topic_campaign_id || self.topic_campaign.try(:campaign_id),
  #       retarget_campaign_id || self.retarget_campaign.try(:campaign_id)
  #     ]
  #   )
  #   # pp ad_groups
  #   {
  #     topic: ad_groups.try(:select) { |g| g[:name].match('display topic') }.try(:first),
  #     retarget: ad_groups.try(:select) { |g| g[:name].match('display retarget') }.try(:first)
  #   }
  # end


  # this is a copy of what's happening in the stories controller
  def create_all_gads
    # self.stories.published.map do |story|
    #   new_gads = {}
    #   if story.topic_ad.blank? || story.retarget_ad.blank?
    #     if story.topic_ad.blank?
    #       story.create_topic_ad(adwords_ad_group_id: story.company.topic_ad_group.id, status: 'ENABLED')
    #     else
    #       new_topic_gad = GoogleAds::create_ad(story.topic_ad)
    #       if new_topic_gad[:ad].present?
    #         story.topic_ad.update(ad_id: new_topic_gad[:ad][:id])
    #       else
    #         new_gads[:topic] = { errors: new_topic_gad[:errors] }
    #       end
    #     end
    #     new_gads[:topic] = story.topic_ad.slice(:ad_id, :long_headline)

    #     if story.retarget_ad.blank?
    #       story.create_retarget_ad(adwords_ad_group_id: story.company.retarget_ad_group.id, status: 'ENABLED')
    #     else
    #       new_retarget_gad = GoogleAds::create_ad(story.retarget_ad)
    #       if new_retarget_gad[:ad].present?
    #         story.retarget_ad.update(ad_id: new_retarget_gad[:ad][:id])
    #       else
    #         new_gads[:retarget] = { errors: new_retarget_gad[:errors] }
    #       end
    #     end
    #     new_gads[:retarget] = story.retarget_ad.slice(:ad_id, :long_headline)

    #   else

    #     # ensure default images are assigned
    #     # (in above case this happens automatically in AdwordsAd callback)
    #     default_images = self.adwords_images.default
    #     [ story.topic_ad, story.retarget_ad ].each do |ad|
    #       ad.square_images << default_images.square_images unless ad.square_images.present?
    #       ad.landscape_images << default_images.landscape_images unless ad.landscape_images.present?
    #       ad.square_logos << default_images.square_logos unless ad.square_logos.present?
    #       ad.landscape_logos << default_images.landscape_logos unless ad.landscape_logos.present?
    #     end
    #     new_gads = GoogleAds::create_story_ads(story)
    #     if new_gads[:errors]
    #       new_gads[:errors].map! do |error|
    #         case error[:type]
    #         when 'INVALID_ID'
    #           "Not found: #{ error[:field].underscore.humanize.downcase.singularize }"
    #         when 'REQUIRED'
    #           "Required: #{ error[:field].underscore.humanize.downcase.singularize }"
    #         # when something else
    #         else
    #         end
    #       end
    #       new_gads[:topic] = { errors: new_gads[:errors].first }
    #       new_gads[:retarget] = { errors: new_gads[:errors].last }
    #     else
    #       story.topic_ad.update(ad_id: new_gads[:topic][:ad_id])
    #       story.retarget_ad.update(ad_id: new_gads[:retarget][:ad_id])
    #     end
    #   end
    #   { story_id: story.id }.merge(new_gads)
    # end
  end

  def remove_all_gads(start_with_known_gads=true)
    # # first remove the ones we know about
    # # => may want to skip this when copying production db to staging
    # if start_with_known_gads
    #   gads_to_remove = self.ads.with_google_id.map do |ad|
    #                       { ad_group_id: ad.ad_group.ad_group_id, ad_id: ad.ad_id }
    #                     end
    #   GoogleAds::remove_ads(gads_to_remove) if gads_to_remove.present?
    # end

    # self.ads.with_google_id.update_all(ad_id: nil)

    # # now remove any orphans that may exist
    # gads = GoogleAds::get_ad_group_ads([ self.topic_ad_group.ad_group_id, self.retarget_ad_group.ad_group_id ])
    # if gads.present?
    #   GoogleAds::remove_ads(
    #     gads.map { |ad| { ad_group_id: ad[:ad_group_id], ad_id: ad[:ad][:id] } }
    #   )
    # end
  end

  # returns "light" or "dark" to indicate font color for a given background color (header_color_2)
  def color_contrast (background_color=nil)
    # method expects hex value in the form of #fafafa (all six digits); see the js implementation for shorthand hex
    if background_color
      hex_color = background_color
    else
      hex_color = self.header_color_2
    end

    # make sure it's a six-character hex value (not counting #)
    if hex_color.length < 7
      loop do
        hex_color << hex_color.last
        break if hex_color.length == 7
      end
    end
    rgb = { r: hex_color[1..2].hex, g: hex_color[3..4].hex, b: hex_color[5..6].hex }

    # // http://www.w3.org/TR/AERT#color-contrast
    o = (((rgb[:r] * 299) + (rgb[:g] * 587) + (rgb[:b] * 114)) / 1000).round
    return (o > 125) ? 'dark' : 'light';
  end

  def missing_default_ad_images? image_type
    ad_images.default.send(image_type).square.blank? and ad_images.default.send(image_type).landscape.blank?
  end

  private


  def matching_ad
    # how to compare an existing gad to a local ad if can't get all fields from gads?
    # => may be forced to delete all on a reset
  end

  # ads_match? => both present, fields match
  # ads_mismatch? => both present, field data mismatch (text/image assets)
  # should_create_ads? => both gads and local data missing
  # should_push_ads? => local data exists but missing from gads
  # should_pull_ads? => gads data exists but missing locally
  # orphaned_ads? => data exists (either locally or gads) for an unpublished story
  def matching_ads
    # return the matching ads
  end

  def mismatching_ads
    # return the mismatching ads
  end

  def should_push_ads?
  end

  def should_pull_ads?
  end

  def should_create_ads?
  end

  def orphaned_ads
    # return
  end

  def fill_daily_gaps visitors, start_date, end_date
    all_dates = []
    if visitors.empty?
      (end_date - start_date).to_i.times do |i|
        all_dates << [(start_date + i).strftime("%-m/%-d"), 0]
      end
      return all_dates
    end
    first_dates = []
    (Date.strptime(visitors[0][0], "%m/%d/%y") - start_date).to_i.times do |index|
      first_dates << [(start_date + index).strftime("%-m/%-d/%y"), 0]
    end
    # check for gaps in the middle of the list, but only if at least two are present
    if visitors.length >= 2
      all_dates = first_dates +
        visitors.each_cons(2).each_with_index.flat_map do |(prev_date, next_date), index|
          prev_datep = Date.strptime(prev_date[0], '%m/%d/%y')
          next_datep = Date.strptime(next_date[0], '%m/%d/%y')
          return_arr = [prev_date]
          delta = (next_datep - prev_datep).to_i
          if delta > 1
            (delta - 1).times do |i|
              return_arr.insert(1, [(next_datep - (i + 1)).strftime("%-m/%-d"), 0])
            end
          end
          if (index == visitors.length - 2)
            return_arr << next_date
          else
            return_arr
          end
        end
    else
      all_dates = first_dates + visitors
    end
    end_delta = (end_date - Date.strptime(all_dates.last[0], "%m/%d/%y")).to_i
    end_delta.times do
      all_dates << [(Date.strptime(all_dates.last[0], "%m/%d/%y") + 1).strftime("%-m/%-d/%y"), 0]
    end
    # get rid of the year
    all_dates.map { |date| [date[0].sub!(/\/\d+$/, ''), date[1]] }
  end

  def fill_weekly_gaps visitors, start_date, end_date
    first_weeks = []
    ((Date.strptime(visitors[0][0], "%m/%d/%y") -
        start_date.beginning_of_week).to_i / 7).times do |index|
      first_weeks << [(start_date.beginning_of_week + index*7).strftime("%-m/%-d/%y"), 0]
    end
    # check for gaps in the middle of the list, but only if at least two are present
    if visitors.length >= 2
      all_weeks = first_weeks +
        visitors.each_cons(2).each_with_index.flat_map do |(prev_week, next_week), index|
          prev_weekp = Date.strptime(prev_week[0], '%m/%d/%y')
          next_weekp = Date.strptime(next_week[0], '%m/%d/%y')
          return_arr = [prev_week]
          delta = (next_weekp - prev_weekp).to_i
          delta /= 7
          if delta > 1
            (delta - 1).times do |i|
              return_arr.insert(1, [(next_weekp - ((i + 1)*7)).strftime("%-m/%-d/%y"), 0])
            end
          end
          if (index == visitors.length - 2)
            return_arr << next_week
          else
            return_arr
          end
        end
    else
      all_weeks = first_weeks + visitors
    end
    end_delta = (end_date.beginning_of_week -
                 Date.strptime(all_weeks.last[0], "%m/%d/%y")).to_i
    end_delta /=7
    end_delta.times do
      all_weeks << [(Date.strptime(all_weeks.last[0], "%m/%d/%y") + 1.week).strftime("%-m/%-d/%y"), 0]
    end
    # get rid of the year
    all_weeks.map { |week| [week[0].sub!(/\/\d+$/, ''), week[1]] }
  end

end
