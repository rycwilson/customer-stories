# frozen_string_literal: true

class Story < ApplicationRecord
  extend OrderAsSpecified
  include FriendlyId

  belongs_to :success
  has_one :company, through: :success
  has_one :customer, through: :success
  has_one :curator, through: :success, class_name: 'User'
  has_many :contributions, through: :success do
    def submissions
      where('contributions.contribution IS NOT NULL')
    end
  end
  has_many :contributors, through: :success
  has_many :visitor_actions, through: :success
  has_many :page_views, through: :success, class_name: 'PageView'
  has_many :visitors, lambda {
    select('visitors.*, visitor_actions.timestamp, visitor_sessions.clicky_session_id').distinct
  }, through: :page_views
  has_many :category_tags, through: :success, source: :story_categories
  has_many :product_tags, through: :success, source: :products
  has_many :results, dependent: :destroy
  has_many :ctas, through: :success, source: :ctas
  has_many :adwords_ads, dependent: :destroy do # topic and retarget
    def enabled?
      all? { |ad| ad.status == 'ENABLED' }
    end

    def status
      first.status # same for each ad
    end

    def long_headline
      first.long_headline  # same for each ad
    end

    def adwords_image
      first.adwords_image  # same for each ad
    end

    def adwords_image=(adwords_image)
      each { |ad| ad.adwords_image = adwords_image }
    end
  end
  alias_method :ads, :adwords_ads
  has_one(
    :topic_ad,
    ->(ad) { where(adwords_ad_group_id: ad.company.topic_campaign.ad_group.id) },
    class_name: 'AdwordsAd'
    # dependent: :destroy
  )
  has_one(
    :retarget_ad,
    ->(ad) { where(adwords_ad_group_id: ad.company.retarget_campaign.ad_group.id) },
    class_name: 'AdwordsAd'
    # dependent: :destroy
  )

  # TODO: remove '*published' columns and status helper
  # while the original 'status' helper and 'published' column still exist,
  # the name of the enum and keys here must be distinct,
  # otherwise there is a conflict with the enum method 'published?'
  # NOTE: Don't use 0 for the first value as this will have unintended consequences in the select UI
  enum status_new: {
    draft: 1,
    listed: 2,
    previewed: 3,
    is_published: 4
  }

  accepts_nested_attributes_for(:results, allow_destroy: true)
  accepts_nested_attributes_for(:topic_ad, allow_destroy: true)
  accepts_nested_attributes_for(:retarget_ad, allow_destroy: true)

  accepts_nested_attributes_for(:success)
  # virtual attribute for accepting a standard format video url
  attr_accessor :formatted_video_url

  # presence of video is determined by a valid thumbnail url which must be fetched and confirmed
  # => ensure the fetch only happens once by assigning to a virtual attribute
  # => story.video = story.video_info() on :show and :edit actions only
  attribute(:video)

  # NOTE: no explicit association to friendly_id_slugs, but it's there
  # Story has many friendly_id_slugs -> captures history of slug changes

  # Story title should be unique, even across companies
  # This because friendly_id allows us to search based on the title slug
  validates :title, presence: true, uniqueness: true

  friendly_id :title, use: %i[slugged finders history]

  scope :published, -> { where(published: true) }
  scope :last_published, -> { where(published: true).order(publish_date: :desc).limit(1) }
  scope :last_logo_published, -> { where(logo_published: true).order(logo_publish_date: :desc).limit(1) }
  scope :featured, lambda {
    joins(:customer)
      .where.not(customers: { logo_url: [nil, ''] })
      .where('logo_published IS TRUE OR preview_published IS TRUE')
  }
  scope :filtered, lambda { |filters, match_type = 'all'|
    # The default object here is the relation that called the scope (typically company.stories)
    return all if filters.blank?

    # Preload associations to avoid N+1 queries and ensure consistent query structure
    # Uses .includes (LEFT JOIN) instead of .joins (INNER JOIN) to prevent excluding
    # records that lack certain associations, which is critical for "match any" logic
    # (e.g. a story with a given product tag will not be included in results if it has no category tags,
    # which is an error in the case of a "match any" query involving both category and product tags)
    base_relation = Story.includes_for_filters(self, filters)
    queries = Story.build_filter_queries(base_relation, filters) # an array of ActiveRecord::Relation objects
    return base_relation if queries.empty?

    match_type == 'all' ? queries.reduce(&:merge) : queries.reduce(&:or)
  }

  before_create { self.og_title = title } 

  after_update_commit do
    og_image_was_updated =
      previous_changes.keys.include?('og_image_url') && previous_changes[:og_image_url].first.present?
    S3Util.delete_object(S3_BUCKET, previous_changes[:og_image_url].first) if og_image_was_updated
  end

  if proc do |story|
    (story.previous_changes.keys &
      %w[og_title og_description og_image_url og_image_alt]).any?
  end
    after_update_commit do
      # TODO: pro-actively expire social network cache on changing og-* fields
      # request = Typhoeus::Request.new(
      #   "https://graph.facebook.com",
      #   method: :POST,
      #   headers: { Authorization: "Bearer <facebook_app_id>|<facebook_access_token>" },
      #   params: {
      #     id: 'https%3A%2F%2Facme-test.customerstories.org%2Fcurate%2Ftestwowin%2Ftestwowin',
      #     scrape: true
      #   }
      # )
      # request.run
      # awesome_print(request.response.response_body)
    end
  end

  # scrub user-supplied html input using whitelist
  before_save(:scrub_html_input, if: proc { narrative.present? && narrative_changed? })

  # update timestamps
  before_save(:update_publish_state)

  def self.default_order(stories_relation)
    stories_relation
      .order('stories.published DESC, stories.preview_published DESC, stories.updated_at DESC')
  end

  def was_published?
    previous_changes.try(:[], :published).try(:[], 1)
  end

  def was_unpublished?
    previous_changes.try(:[], :published).try(:[], 0)
  end

  def should_generate_new_friendly_id?
    new_record? || title_changed? || slug.blank?
  end

  def status
    if published?
      'published'
    elsif preview_published?
      'preview-published'
    elsif logo_published?
      'logo-published'
    else
      'not-published'
    end
  end

  def scrub_html_input
    # white_list_sanitizer = Rails::Html::WhiteListSanitizer.new
    # self.narrative = white_list_sanitizer.sanitize(content, tags: %w(a p span div strong i u em section blockquote cite br pre font h1 h2 h3 h4 h5 h6 table tr td ol ul li hr img), attributes: %w(id class style face href src))
  end

  # Returns a friendly id path that may or may not include a product segment
  def csp_story_path
    Rails.application.routes.url_helpers.published_story_path(path_segments)
  end

  # Returns a friendly id url that may or may not include a product segment
  def csp_story_url
    Rails.application.routes.url_helpers.published_story_url(path_segments.merge(subdomain: company.subdomain))
  end

  def path_segments
    segments = { customer: customer.slug, title: slug }
    segments.merge(product: product_tags.take.slug) if product_tags.present?
    segments
  end

  def csp_story_link(is_curator, is_plugin, is_external, plugin_type)
    if is_curator
      Rails.application.routes.url_helpers.edit_story_path(id)
    elsif published?
      is_external ? csp_story_url : csp_story_path
    elsif preview_published?
      if is_plugin && %w[gallery carousel].include?(plugin_type)
        csp_story_url
      elsif is_plugin && plugin_type == 'tabbed_carousel'
        is_external ? Rails.application.routes.url_helpers.root_url(subdomain: company.subdomain) + "?preview=#{slug}" : "/?preview=#{slug}"
      else
        'javascript:;'
      end
    end
  end

  # defining this method makes it easy to include the edit_story_path helper
  # with activity feed response (contributions_submitted and contribution_requests_received)
  def csp_edit_story_path
    url_helpers = Rails.application.routes.url_helpers
    url_helpers.edit_story_path(id)
  end

  ##
  #  video_url looks like one of these ...
  #
  #  "https://www.youtube.com/embed/#{youtube_id}"
  #  "https://player.vimeo.com/video/#{vimeo_id}"
  #  "https://fast.wistia.com/embed/medias/#{wistia_id}.jsonp"
  #
  #  TODO
  #  the video params can be set here instead of in javascript, e.g.
  #  https://fast.wistia.com/embed/iframe/b0767e8ebb?version=v1&controlsVisibleOnLoad=true&playerColor=aae3d
  #
  #
  def video_info
    provider = video_url&.match(/youtu\.be|youtube|vimeo|wistia/).try(:[], 0)
    video_path = provider ? URI(video_url)&.path : nil
    id = video_path&.slice(video_path.rindex('/') + 1, video_path.length)&.sub(/\.\w+\z/, '')
    thumbnail = if !id
                  nil
                else
                  case provider
                  when 'youtube'
                    thumbnail_url = "https://img.youtube.com/vi/#{id}/mqdefault.jpg"
                    # thumbnail_url = "https://i.ytimg.com/vi_webp/#{id}/mqdefault.webp"
                    res = Net::HTTP.get_response(URI(thumbnail_url))
                    res.code == '200' ? thumbnail_url : nil
                  when 'youtu.be'
                    thumbnail_url = "https://i.ytimg.com/vi_webp/#{id}/mqdefault.webp"
                    res = Net::HTTP.get_response(URI(thumbnail_url))
                    res.code == '200' ? thumbnail_url : nil
                  when 'vimeo'
                    video_data_url = "https://vimeo.com/api/oembed.json?url=https%3A//vimeo.com/#{id}"
                    res = Net::HTTP.get_response(URI(video_data_url))
                    begin
                      JSON.parse(res.body).try(:[], 'thumbnail_url')
                    rescue StandardError
                      nil
                    end

                  # in this case it's the actual video url instead of a thumbnail or data url; fetching cofirms its availability
                  # wistia videos are self-contained and won't reference video_info[:thumnbanil_url]
                  when 'wistia'
                    res = Net::HTTP.get_response(URI(video_url))
                    res.code == '200' ? true : nil
                  end
                end
    { provider: provider, id: id, thumbnail_url: thumbnail }.compact
  end

  def contributors_jsonld
    contributors.map do |contributor|
      { '@type' => 'Person',
        'name' => contributor.full_name }
    end
  end

  def edit_ad_images_path
    return '' if topic_ad.nil?

    Rails.application.routes.url_helpers.edit_story_adwords_ad_path(self, topic_ad)
  end

  def about_jsonld
    customer = success.customer
    [{ '@type' => 'Corporation',
       'name' => customer.name,
       'logo' => { '@type' => 'ImageObject',
                   'url' => customer.logo_url } }] +
      success.products.map do |product|
        { '@type' => 'Product',
          'name' => product.name }
      end
  end

  def related_stories
    same_product_stories = []
    same_category_stories = []
    published_stories = company.stories.published - [self]
    product_tags.each do |product|
      same_product_stories += published_stories.joins(:product_tags).where(products: { id: product.id })
    end
    category_tags.each do |category|
      same_category_stories += published_stories.joins(:category_tags).where(story_categories: { id: category.id })
    end
    same_tag_stories = (same_product_stories + same_category_stories).uniq
    related_stories = if same_product_stories.length >= 2
                        same_product_stories.sample(2)
                      elsif same_tag_stories.length >= 2
                        same_tag_stories.sample(2)
                      elsif same_tag_stories.empty?
                        published_stories.sample(2)
                      else
                        same_tag_stories + published_stories.sample(2 - same_tag_stories.length)
                      end
    default_order(related_stories)
  end

  #
  # returns number of unique visitors
  #
  def unique_visitors_count
    unique_visitors = Set.new
    story_views = PageView.includes(:visitor).where(success_id: success_id)
    story_views.each do |story_view|
      unique_visitors << story_view.visitor.clicky_uid
    end
    unique_visitors.length
  end

  def update_publish_state
    if logo_published? && logo_published_was == false
      self.logo_publish_date = Time.now
    elsif !logo_published? && logo_published_was == true
      self.logo_publish_date = nil
    end
    if preview_published? && preview_published_was == false
      self.preview_publish_date = Time.now
    elsif !preview_published? && preview_published_was == true
      self.preview_publish_date = nil
    end
    if published? && published_was == false
      self.publish_date = Time.now
    elsif !published? && published_was == true
      self.publish_date = nil
    end
  end

  class << self

    def includes_for_filters(base_relation, filters)
      relation = base_relation # typically company.stories
      relation = relation.includes(:success) if filters[:curator].present? || filters[:customer].present?
      relation = relation.includes(:category_tags) if filters[:category].present?
      relation = relation.includes(:product_tags) if filters[:product].present?
      relation
    end

    def build_filter_queries(base_relation, filters)
      filters.filter_map do |type, id|
        next if id.blank?

        case type
        when :curator
          base_relation.where(successes: { curator_id: id })
        when :status
          base_relation.where(status_new: id)
        when :customer
          base_relation.where(successes: { customer_id: id })
        when :category
          base_relation.where(story_categories: { id: id })
        when :product
          base_relation.where(products: { id: id })
        end
      end
    end
  end
end
