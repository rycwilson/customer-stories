class Company < ActiveRecord::Base

  require 'adwords_api'
  ADWORDS_API_VERSION = :v201702

  CSP = self.find(5)

  before_validation :smart_add_url_protocol

  validates :name, presence: true, uniqueness: true
  validates :subdomain, presence: true, uniqueness: true
  validates :website, presence: true, uniqueness: true, website: true
  validates_length_of :subdomain, maximum: 32, message: "must be 32 characters or less"
  validates_format_of :subdomain, with: /\A[a-z0-9-]*\z/, on: [:create, :update], message: "may only contain lowercase alphanumerics or hyphens"
  validates_exclusion_of :subdomain, in: ['www', 'mail', 'ftp'], message: "is not available"

  has_many :users # no dependent: :destroy users, handle more gracefully

  has_many :customers, dependent: :destroy do
    def select_options
      self.sort_by { |c| c.name }.map { |customer| [ customer.name, customer.id ] }
    end
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
      self.sort_by { |c| c.last_name }.map { |curator| [ curator.full_name, curator.id ] }
    end
  end
  has_many :contributions, -> { includes(:contributor, :referrer, success:{customer:{}}) }, through: :successes
  has_many :contributors, -> { distinct }, through: :customers, source: :contributors
  has_many :referrers, -> { distinct }, through: :contributions, source: :referrer
  has_many :stories, through: :successes do
    def select_options
      self.select { |story| story.published? }
          .map() { |story| [ story.title, story.id ] }
          .unshift( ['All', 0] )
    end
    def published
      self.select { |story| story.published? }
    end
    def with_ads
      # any ads with status 'REMOVED' have .destroy() calls in the delayed job queue
      self.select() do |story|
        story.topic_ad.present? && story.topic_ad.status != 'REMOVED' &&
        story.retarget_ad.present? && story.retarget_ad.status != 'REMOVED'
      end
      .sort_by { |story| story.publish_date }.reverse
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
    def select_options
      self.map do |category|
        [ category.name, category.id, { data: { slug: category.slug } } ]
      end.sort
    end
    def public_select_options
      self.joins(:stories)
          .where(stories: { logo_published: true })
          .distinct
          .map { |category| [ category.name, category.id, { data: { slug: category.slug } } ] }
          .sort
    end
  end
  # alias
  has_many :category_tags, class_name: 'StoryCategory'
  has_many :products, dependent: :destroy do
    def select_options
      self.map do |product|
        [ product.name, product.id, { data: { slug: product.slug } } ]
      end.sort
    end
    def public_select_options
      self.joins(:stories)
          .where(stories: { logo_published: true })
          .distinct
          .map { |product| [ product.name, product.id, { data: { slug: product.slug } } ] }
          .sort
    end
  end
  # alias
  has_many :product_tags, class_name: 'Product'
  has_many :email_templates, dependent: :destroy
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
  # alias
  has_many :ctas, class_name: 'ContributorQuestion', foreign_key: 'company_id'
  has_many :crowdsourcing_templates, dependent: :destroy do
    def customer
      where(name: 'Customer').take
    end
    def customer_success
      where(name: 'Customer Success').take
    end
    def sales
      where(name: 'Sales').take
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
  # alias
  has_many :templates, class_name: 'CrowdsourcingTemplate', foreign_key: 'company_id'
  has_many :outbound_actions, dependent: :destroy

  has_many :call_to_actions, dependent: :destroy
  # alias and methods
  has_many :ctas, class_name: 'CallToAction', foreign_key: 'company_id' do
    def primary
      where(primary: true).take
    end
    def secondary
      where(primary: false)
    end
    def select_options
      grouped_options =
        [ [ 'Links', ['none available'] ], [ 'Web Forms', ['none available'] ] ]
      self.secondary.each do |cta|
        case cta.type
        when 'CTALink'
          if grouped_options[0][1][0] == 'none available'
            grouped_options[0][1][0] = [ cta.description, cta.id ]
          else
            grouped_options[0][1] << [ cta.description, cta.id ]
          end
        when 'CTAForm'
          if grouped_options[1][1][0] == 'none available'
            grouped_options[1][1][0] = [ cta.description, cta.id ]
          else
            grouped_options[1][1] << [ cta.description, cta.id ]
          end
        end
      end
      grouped_options
    end
  end
  has_one :widget, dependent: :destroy
  has_many :adwords_campaigns, dependent: :destroy do
    def topic
      where(type:'TopicCampaign').take
    end
    def retarget
      where(type:'RetargetCampaign').take
    end
  end
  alias_attribute :campaigns, :adwords_campaigns
  has_many :adwords_ads, through: :adwords_campaigns
  alias_attribute :ads, :adwords_ads
  has_many :adwords_images, dependent: :destroy do
    def default
      where(company_default: true).take
    end
  end
  accepts_nested_attributes_for :adwords_images, allow_destroy: true

  after_commit(on: [:create]) do
    self.create_widget

    # default crowdsourcing templates (formerly email templates, futurely invitation templates)
    Company::CSP.crowdsourcing_templates.each do |factory_template|
      company_template = factory_template.dup
      self.crowdsourcing_templates << company_template
      factory_template.contributor_questions.each do |factory_question|
        new_question = factory_question.dup
        self.contributor_questions << new_question
        company_template.contributor_questions << new_question
      end
      company_template.save
    end
  end

  after_commit :expire_fragment_cache, on: :update,
    if: Proc.new { |company|
      (company.previous_changes.keys & ['header_color_1', 'header_text_color']).any?
    }

  # virtual attributes
  attr_writer :default_adwords_image_url

  def all_stories
    Rails.cache.fetch("#{self.subdomain}/all_stories") do
      Story.order(Story.company_all(self.id)).pluck(:id)
    end
  end

  def published_stories
    Story.order(Story.company_published(self.id)).pluck(:id)
  end

  def published_stories_filter_category category_id
    Story.order(Story.company_published_filter_category(self.id, category_id)).pluck(:id)
  end

  def published_stories_filter_product product_id
    Story.order(Story.company_published_filter_product(self.id, product_id)).pluck(:id)
  end

  # public stories are logo_published or published
  def public_stories
    Story.order(Story.company_public(self.id)).pluck(:id)
  end

  def public_stories_filter_category (category_id)
    Story.order(Story.company_public_filter_category(self.id, category_id)).pluck(:id)
  end

  def public_stories_filter_product (product_id)
    Story.order(Story.company_public_filter_product(self.id, product_id)).pluck(:id)
  end

  # TODO: faster? http://stackoverflow.com/questions/20014292
  def filter_stories_by_tag filter_params
    if filter_params[:id] == '0'  # all stories
      story_ids = self.public_stories
    else
      case filter_params[:tag]  # all || category || product
        when 'all'
          story_ids = self.public_stories
        when 'category'
          # use the slug to look up the category id,
          # unless filter_params[:id] already represents the id
          category_id = (StoryCategory
                           .friendly
                           .find(filter_params[:id]) # will find whether id or slug
                           .id unless filter_params[:id].to_i != 0).try(:to_i) ||
                        filter_params[:id].to_i
          story_ids = self.public_stories_filter_category(category_id)
        when 'product'
          # use the slug to look up the product id,
          # unless filter_params[:id] already represents the id
          product_id = (Product
                          .friendly
                          .find(filter_params[:id])
                          .id unless filter_params[:id].to_i != 0).try(:to_i) ||
                       filter_params[:id].to_i
          story_ids = self.public_stories_filter_product(product_id)
        else
      end
    end
    Story.find(story_ids).sort_by { |story| story_ids.index(story.id) }
  end

  def stories_filter_public_grouped_options
    options = {}
    category_options = StoryCategory
                         .joins(:stories)
                         .where({ company_id: self.id, stories: { logo_published: true } })
                         .distinct
                         .map { |tag| [tag.name, tag.id, { data: { slug: tag.slug } }] }
    product_options = Product
                        .joins(:stories)
                        .where({ company_id: self.id, stories: { logo_published: true } })
                        .distinct
                        .map { |tag| [tag.name, tag.id, { data: { slug: tag.slug } }] }
    if category_options.length > 1
      options.merge!({ 'Category' => category_options })
    end
    if product_options.length > 1
      options.merge!({ 'Product' => product_options })
    end
    options
  end

  #
  # method returns a fragment cache key that looks like this:
  #
  #   #{self.subdomain}/stories-index-{tag}-xx-memcache-iterator-yy
  #
  # tag is 'all', 'category', or 'product'
  # xx is the selected filter id (0 if none selected)
  # yy is the memcache iterator
  #
  def stories_index_cache_key (filter_params)
    memcache_iterator = self.stories_index_fragments_memcache_iterator
    "#{self.subdomain}/" +
    "stories-index-#{filter_params[:tag]}-#{filter_params[:id]}-" +  # id = 0 -> all
    "memcache-iterator-#{memcache_iterator}"
  end

  #
  # two methods below return a fragment cache key that looks like this:
  #
  #   trunity/category-select-xx-memcache-iterator-yy
  #
  #   xx is the selected category id (0 if none selected)
  #   yy is the memcache iterator
  #
  def category_select_cache_key (category_id)
    "#{self.subdomain}/" +
    "category-select-#{category_id}-memcache-iterator-" +
    "#{self.category_select_fragments_memcache_iterator}"
  end

  def product_select_cache_key (product_id)
    "#{self.subdomain}/" +
    "product-select-#{product_id}-memcache-iterator-" +
    "#{self.product_select_fragments_memcache_iterator}"
  end

  #
  # category/product select fragments (all and pre-selected) invalidated by:
  # -> attach/detach tags IF the story has logo published
  # -> story publish state IF story is tagged
  #
  def category_select_fragments_memcache_iterator
    Rails.cache.fetch(
      "#{self.subdomain}/category-select-fragments-memcache-iterator"
    ) { rand(10) }
  end

  def increment_category_select_fragments_memcache_iterator
    Rails.cache.write(
      "#{self.subdomain}/category-select-fragments-memcache-iterator",
      self.category_select_fragments_memcache_iterator + 1
    )
  end

  def product_select_fragments_memcache_iterator
    Rails.cache.fetch(
      "#{self.subdomain}/product-select-fragments-memcache-iterator") { rand(10) }
  end

  def increment_product_select_fragments_memcache_iterator
    Rails.cache.write(
      "#{self.subdomain}/product-select-fragments-memcache-iterator",
      self.product_select_fragments_memcache_iterator + 1)
  end

  # stories_json returns data included in the client via the gon object
  def stories_json
    Rails.cache.fetch("#{self.subdomain}/stories_json") do
      JSON.parse(
        Story.order(Story.company_all(self.id))
        .to_json({
          only: [:id, :title, :summary, :quote, :quote_attr_name, :quote_attr_title, :published, :logo_published, :preview_published, :publish_date, :updated_at],
          methods: [:csp_story_path, :published_contributors, :preview_contributor],
          include: {
            success: {
              only: [:curator_id],
              include: {
                customer: { only: [:id, :name, :logo_url] },
                story_categories: { only: [:id, :name, :slug] },
                products: { only: [:id, :name, :slug] } }}}
        })
      )
    end
  end

  # stories_json contains a bunch of association data;
  # all_stories is just an array of ids
  def expire_all_stories_cache json_only
    if json_only
      Rails.cache.delete("#{self.subdomain}/stories_json")
    else
      Rails.cache.delete("#{self.subdomain}/stories_json")
      Rails.cache.delete("#{self.subdomain}/all_stories")
    end
  end

  def curator? current_user=nil
    return false if current_user.nil?
    current_user.company_id == self.id
  end

  def update_tags (new_category_tags, new_product_tags)
    # remove deleted category tags ...
    self.story_categories.each do |category|
      unless new_category_tags.include?(category.id.to_s)
        tag_instances = StoryCategoriesSuccess.where(story_category_id: category.id)
        # expire filter select fragment cache
        self.expire_filter_select_fragments_on_tag_destroy('category', tag_instances)
        # untag stories
        tag_instances.destroy_all
        category.destroy
      end
    end
    # add new category tags ...
    new_category_tags.each do |category_id|
      if category_id.to_i == 0   # new (custom or default) tag
        self.story_categories.create(name: category_id)
        # expire filter select fragment cache
        self.increment_category_select_fragments_memcache_iterator
      else
        # do nothing
      end
    end
    # remove deleted product tags ...
    self.products.each do |product|
      unless new_product_tags.include?(product.id.to_s)
        tag_instances = ProductsSuccess.where(product_id: product.id)
        # expire filter select fragment cache
        self.expire_filter_select_fragments_on_tag_destroy('product', tag_instances)
        # untag stories
        tag_instances.destroy_all
        product.destroy
      end
    end
    # add new product tags ...
    new_product_tags.each do |product_id|
      if product_id.to_i == 0 # new tag
        self.products.create(name: product_id)
        # expire filter select fragment cache
        self.increment_product_select_fragments_memcache_iterator
      else
        # do nothing
      end
    end
  end

  def templates_select
    self.email_templates.map do |template|
      [template.name, template.id]
    end
    .sort
    .unshift( [""] )
  end

  # when destroying a tag, expire affected filter select fragments
  def expire_filter_select_fragments_on_tag_destroy (tag, tag_instances)
    tag_instances.each do |tag_instance|
      if tag_instance.success.story.logo_published?
        if tag == 'category'
          self.increment_category_select_fragments_memcache_iterator
        elsif tag == 'product'
          self.increment_product_select_fragments_memcache_iterator
        end
      end
    end
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

  # changes to company colors expires all gallery fragments
  def expire_fragment_cache
    self.increment_stories_index_fragments_memcache_iterator
    self.increment_story_tile_fragments_memcache_iterator
  end

  # expiration of a story tile fragment with logo published
  # expires all stories index fragments
  # rand(10) provides an initial value if none exists
  def stories_index_fragments_memcache_iterator
    Rails.cache.fetch("#{self.subdomain}/stories-index-fragments-memcache-iterator") { rand(10) }
  end

  def increment_stories_index_fragments_memcache_iterator
    Rails.cache.write(
      "#{self.subdomain}/stories-index-fragments-memcache-iterator",
      self.stories_index_fragments_memcache_iterator + 1)
  end

  # all story fragments must be expired if these attributes change: header_color_1, header_text_color
  def story_tile_fragments_memcache_iterator
    Rails.cache.fetch("#{self.subdomain}/stories-tile-fragments-memcache-iterator") { rand(10) }
  end

  def increment_story_tile_fragments_memcache_iterator
    Rails.cache.write(
      "#{self.subdomain}/stories-tile-fragments-memcache-iterator",
      self.story_tile_fragments_memcache_iterator + 1)
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
        Success.find(success_list.to_a).map { |success| [ success.id, success.story.title ] }.to_h
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
    visitors = Rails.cache.fetch("#{self.subdomain}/visitors-chart-default") do
                 self.visitors_chart_json
               end
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

    # referrer_types = Rails.cache.fetch("#{self.subdomain}/referrer-types-default") do
    #                    self.visitors_chart_json
    #                  end
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

  # when a new default is uploaded, assign it as default or create it if it doesn't exist;
  # save the old default as an additional image;
  # if this is the initial default uploaded, update any ads
  #   that don't currently have an image
  def update_uploaded_default_adwords_image (uploaded_image_url)
    if self.adwords_images.default.present?
      self.adwords_images.default.update(company_default: false)
      AdwordsImage.create(company_id: self.id, company_default: true,
                          image_url: uploaded_image_url)
    else
      AdwordsImage.create(company_id: self.id, company_default: true,
                          image_url: uploaded_image_url)
      self.ads.each { |ad| ad.adwords_image = self.adwords_images.default }
    end
  end


  # accepts adwords objects and creates csp campaigns / ad groups / ads
  # NOTE: We need to build up the campaigns and associated ad groups and
  #       ads, then when everything is built, save the campaign
  #       (which will save the associated ad groups and ads.)
  #       Else, the campaigns and ad groups will not be persisted
  #       and attempting to create ads will result in error
  def adwords_sync
    # destroy the ads, but not the campaigns and ad groups (unlike master seeds)
    self.ads.each { |ad| ad.destroy }

    topic_campaign = self.get_adwords_campaign('topic')
    topic_ad_group = self.get_adwords_ad_group(topic_campaign[:id])
    topic_ads = self.get_adwords_ads(topic_ad_group[:id]) || []
    retarget_campaign = self.get_adwords_campaign('retarget')
    retarget_ad_group = self.get_adwords_ad_group(retarget_campaign[:id])
    retarget_ads = self.get_adwords_ads(retarget_ad_group[:id]) || []

    # topic campaign / ad group / ads
    self.campaigns.topic.update(
      campaign_id: topic_campaign[:id], status: topic_campaign[:status],
      name: topic_campaign[:name]
    )
    self.campaigns.topic.ad_group.update(
      ad_group_id: topic_ad_group[:id], status: topic_ad_group[:status],
      name: topic_ad_group[:name]
    )
    # retarget campaign / ad group / ads
    self.campaigns.retarget.update(
      campaign_id: retarget_campaign[:id], status: retarget_campaign[:status],
      name: retarget_campaign[:name]
    )
    self.campaigns.retarget.ad_group.update(
      ad_group_id: retarget_ad_group[:id], status: retarget_ad_group[:status],
      name: retarget_ad_group[:name]
    )

    # create csp ads to mirror adwords ads
    self.create_csp_ads(topic_ads, retarget_ads)

    # for any stories that are published but don't have an ad ...
    # save ids in an array, as the ad must first be persisted in order for
    # ActionController::create_ad to work correctly
    self.stories.published.each do |story|
      unless story.ads.present?
        create_csp_and_aw_ads(story)
      end
    end
  end  # sync_with_adwords

  def ready_for_adwords_sync?
    self.promote_tr? &&
    self.adwords_short_headline.present?
    self.adwords_logo_url.present? &&
    self.adwords_logo_media_id.present? &&
    self.adwords_images.default.present? &&
    self.adwords_images.default.try(:media_id).present?
  end

  def create_shell_campaigns
    topic_campaign = self.campaigns.create(type:'TopicCampaign')
    topic_campaign.create_adwords_ad_group()
    retarget_campaign = self.campaigns.create(type:'RetargetCampaign')
    retarget_campaign.create_adwords_ad_group()
  end

  def get_adwords_campaign (campaign_type)
    api = create_adwords_api()
    service = api.service(:CampaignService, ADWORDS_API_VERSION)
    selector = {
      :fields => ['Id', 'Name', 'Status', 'Labels'],
      :ordering => [{:field => 'Id', :sort_order => 'ASCENDING'}],
      :paging => {:start_index => 0, :number_results => 50}
    }
    result = nil
    begin
      result = service.get(selector)
    rescue AdwordsApi::Errors::ApiException => e
      logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      flash.now[:alert] =
          'API request failed with an error, see logs for details'
    end
    result[:entries].find do |campaign|
      campaign[:labels].any? { |label| label[:name] == self.subdomain } &&
      campaign[:labels].any? { |label| label[:name] == campaign_type }
    end
  end

  def get_adwords_ad_group (campaign_id)
    api = create_adwords_api()
    service = api.service(:AdGroupService, ADWORDS_API_VERSION)
    selector = {
      fields: ['Id', 'Name', 'Status'],
      ordering: [ { field: 'Id', sort_order: 'ASCENDING' } ],
      paging: { start_index: 0, number_results: 50 },
      predicates: [ { field: 'CampaignId', operator: 'IN', values: [campaign_id] } ]
    }
    result = nil
    begin
      result = service.get(selector)
    rescue AdwordsApi::Errors::ApiException => e
      logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      flash.now[:alert] =
          'API request failed with an error, see logs for details'
    end
    result[:entries][0]
  end

  def get_adwords_ads (ad_group_id)
    api = create_adwords_api()
    service = api.service(:AdGroupAdService, ADWORDS_API_VERSION)
    selector = {
      fields: ['Id', 'Name', 'Status', 'LongHeadline', 'Labels'],
      ordering: [{ field: 'Id', sort_order: 'ASCENDING' }],
      paging: { start_index: 0, number_results: 50 },
      predicates: [ { field: 'AdGroupId', operator: 'IN', values: [ad_group_id] } ]
    }
    result = nil
    begin
      result = service.get(selector)
    rescue AdwordsApi::Errors::ApiException => e
      logger.fatal("Exception occurred: %s\n%s" % [e.to_s, e.message])
      flash.now[:alert] =
        'API request failed with an error, see logs for details'
    end
    result[:entries]
  end

  def get_adwords_images
    api = create_adwords_api()
    service = api.service(:MediaService, ADWORDS_API_VERSION)
    # Get all the images and videos.
    selector = {
      :fields => ['MediaId', 'Height', 'Width', 'MimeType', 'Urls'],
      :ordering => [
        {:field => 'MediaId', :sort_order => 'ASCENDING'}
      ],
      :predicates => [
        {:field => 'Type', :operator => 'IN', :values => ['IMAGE', 'VIDEO']}
      ],
      :paging => {
        :start_index => 0,
        :number_results => 150
      }
    }

    begin
      result = service.get(selector)
    # Authorization error.
    rescue AdsCommon::Errors::OAuth2VerificationRequired => e
      puts "Authorization credentials are not valid. Edit adwords_api.yml for " +
          "OAuth2 client ID and secret and run misc/setup_oauth2.rb example " +
          "to retrieve and store OAuth2 tokens."
      puts "See this wiki page for more details:\n\n  " +
          'https://github.com/googleads/google-api-ads-ruby/wiki/OAuth2'

    # HTTP errors.
    rescue AdsCommon::Errors::HttpError => e
      puts "HTTP Error: %s" % e

    # API errors.
    rescue AdwordsApi::Errors::ApiException => e
      puts "Message: %s" % e.message
      puts 'Errors:'
      e.errors.each_with_index do |error, index|
        puts "\tError [%d]:" % (index + 1)
        error.each do |field, value|
          puts "\t\t%s: %s" % [field, value]
        end
      end
    end
    if result[:entries]
      result[:entries].each do |entry|
        full_dimensions = entry[:dimensions]['FULL']
        puts "Entry ID %d dimensions %dx%d MIME type '%s' url '%s'" %
            [entry[:media_id], full_dimensions[:height],
             full_dimensions[:width], entry[:mime_type], entry[:urls]['FULL']]
      end
    end
    if result.include?(:total_num_entries)
      puts "\tFound %d entries." % result[:total_num_entries]
    end
  end

  # image_params = { type: 'landscape' || 'logo', url: url }
  def upload_adwords_image_or_logo (image_params)
    api = create_adwords_api()
    service = api.service(:MediaService, ADWORDS_API_VERSION)
    # if image_url is nil: Invalid URL: #<ActionDispatch::Http::UploadedFile:0x007f8615701348>
    img_url = image_params[:url]
    img_data = AdsCommon::Http.get(img_url, api.config)
    base64_image_data = Base64.encode64(img_data)
    image = {
      :xsi_type => 'Image',
      :data => base64_image_data,
      :type => 'IMAGE'
    }

    begin
      response = service.upload([image])

    rescue AdsCommon::Errors::HttpError => e
      puts "HTTP Error: %s" % e
      flash_mesg = e.message
      AdwordsImage.find_by(image_url: image_params[:url]).destroy
      cookies[:workflow_stage] = 'promote'
      cookies[:workflow_substage] = 'promote-settings'
      redirect_to(company_path(company), flash: { danger: flash_mesg }) and return

    rescue AdwordsApi::Errors::ApiException => e
      puts "Message: %s" % e.message
      puts 'Errors:'
      e.errors.each_with_index do |error, index|
        puts "\tError [%d]:" % (index + 1)
        error.each do |field, value|
          puts "\t\t%s: %s" % [field, value]
        end
      end
      if e.message.match(/ImageError.UNEXPECTED_SIZE/)
        flash_mesg = "Image does not meet size requirements"
      else
        flash_mesg = e.message
      end
      AdwordsImage.find_by(image_url: image_params[:url]).destroy
      cookies[:workflow_stage] = 'promote'
      cookies[:workflow_substage] = 'promote-settings'
      redirect_to(company_path(self), flash: { danger: flash_mesg }) and return
    end

    # assign adwords media_id
    if image_params[:type] == 'logo'
      self.update(adwords_logo_media_id: response[0][:media_id])
    elsif (image_params[:type] == 'landscape')
      self.adwords_images.find() { |adwords_image| adwords_image.image_url == image_params[:url] }
                  .update(media_id: response[0][:media_id])
    end

    if response and !response.empty?
      ret_image = response.first
      full_dimensions = ret_image[:dimensions]['FULL']
      puts ("Image with ID %d, dimensions %dx%d and MIME type '%s' uploaded " +
          "successfully.") % [ret_image[:media_id], full_dimensions[:height],
           full_dimensions[:width], ret_image[:mime_type]]
    else
      puts 'No images uploaded.'
      return false
    end
    return true
  end

  ##
  ##  method creates csp ads and associated adwords image (if image doesn't already exist)
  ##  from adwords ads (topic_ads and retarget_ads)
  ##
  ##  if a story isn't published, remove the adwords ad and don't create a csp ad
  ##  if a story wasn't given a story id label, remove it
  ##
  #
  # NOTE: campaigns haven't been saved when this method is called,
  # but able to access via self.campaigns?
  def create_csp_ads (topic_ads, retarget_ads)
    return false if (topic_ads.nil? || retarget_ads.nil?)  # no ads
    self.campaigns.each() do |campaign|
      aw_ads = (campaign.type == 'TopicCampaign') ? topic_ads : retarget_ads
      aw_ads.each() do |aw_ad|
        # ads are tagged with story id
        # if no story id label, try the long headline
        story = Story.find_by(id: aw_ad[:labels].try(:[], 0).try(:[], :name)) ||
                Story.find_by(title: aw_ad[:ad][:long_headline])
        if story.present? && story.published?
          csp_ad = campaign.ad_group.ads.create(
            story_id: story.id,
            ad_id: aw_ad[:ad][:id],
            long_headline: aw_ad[:ad][:long_headline],
            status: aw_ad[:status],
            approval_status: aw_ad[:approval_status]
          )
          csp_ad.adwords_image =
            self.adwords_images.find() do |image|
              image.media_id == aw_ad[:ad][:marketing_image][:media_id]
            end ||
            self.adwords_images.create(
              media_id: aw_ad[:ad][:marketing_image][:media_id],
              image_url: aw_ad[:ad][:marketing_image][:urls]['FULL']
            )
        else
          # remove the ad if story can't be found OR story isn't published
          campaign.ad_group.ads.build({ ad_id: aw_ad[:ad][:id] }).remove()
        end
      end
    end
  end

   # returns "light" or "dark" to indicate font color for a given background color (header_color_2)
  def color_contrast (background_color=nil)
    # method expects hex value in the form of #fafafa (all six digits); see the js implementation for shorthand hex
    if background_color
      hex = background_color
    else
      hex = self.header_color_2
    end
    rgb = { r: hex[1..2].hex, g: hex[3..4].hex, b: hex[5..6].hex }

    # // http://www.w3.org/TR/AERT#color-contrast
    o = (((rgb[:r] * 299) + (rgb[:g] * 587) + (rgb[:b] * 114)) / 1000).round
    return (o > 125) ? 'dark' : 'light';
  end

  private

  # Creates an instance of AdWords API class
  def create_adwords_api ()
    if ENV['ADWORDS_ENV'] == 'test'
      config_file = File.join(Rails.root, 'config', 'adwords_api_test.yml')
    elsif ENV['ADWORDS_ENV'] == 'production'
      config_file = File.join(Rails.root, 'config', 'adwords_api_prod.yml')
    end
    AdwordsApi::Api.new(config_file)
  end

  def create_csp_and_aw_ads (story)
    self.campaigns.each() do |campaign|
      csp_ad = campaign.ad_group.ads.create(
        story_id: story.id, long_headline: story.title
      )
      csp_ad.adwords_image = self.adwords_images.default
      csp_ad.create()
    end
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
