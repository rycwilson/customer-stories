class Story < ActiveRecord::Base

  include FriendlyId

  belongs_to :success
  has_many :outbound_actions_stories, dependent: :destroy
  has_many :outbound_actions, through: :outbound_actions_stories

  # Note: no explicit association to friendly_id_slugs, but it's there
  # Story has many friendly_id_slugs -> captures history of slug changes

  # Story title should be unique, even across companies
  # This because friendly_id allows us to search based on the title slug
  validates :title, presence: true, uniqueness: true

  friendly_id :title, use: [:slugged, :finders, :history]

  # scrub user-supplied html input using whitelist
  before_save :scrub_html_input, on: [:create, :update],
              if: Proc.new { self.content.present? && self.content_changed? }

  scope :company_all, ->(company_id) {
    joins(success: { customer: {} })
    .where(customers: { company_id: company_id })
  }
  scope :company_all_filter_category, ->(company_id, category_id) {
    joins(success: { customer: {}, story_categories: {} })
    .where(customers: { company_id: company_id },
           story_categories: { id: category_id } )
  }
  scope :company_all_filter_product, ->(company_id, product_id) {
    joins(success: { customer: {}, products: {} })
    .where(customers: { company_id: company_id },
           products: { id: product_id } )
  }
  scope :company_published, ->(company_id) {
    company_public(company_id).where(published: true)
  }
  scope :company_published_filter_category, ->(company_id, category_id) {
    joins(success: { customer: {}, story_categories: {} })
    .where(published: true,
           customers: { company_id: company_id },
           story_categories: { id: category_id })
  }
  scope :company_published_filter_product, ->(company_id, product_id) {
    joins(success: { customer: {}, products: {} })
    .where(published: true,
           customers: { company_id: company_id },
           products: { id: product_id })
  }
  scope :company_public, ->(company_id) {
    joins(success: { customer: {} })
    .where(logo_published: true,
           customers: { company_id: company_id })
  }
  scope :company_public_filter_category, ->(company_id, category_id) {
    joins(success: { customer: {}, story_categories: {} })
    .where(logo_published: true,
           customers: { company_id: company_id },
           story_categories: { id: category_id })
  }
  scope :company_public_filter_product, ->(company_id, product_id) {
    joins(success: { customer: {}, products: {} })
    .where(logo_published: true,
           customers: { company_id: company_id },
           products: { id: product_id })
  }

  after_commit on: [:create, :destroy] do
    expire_all_stories_cache(false)
  end

  # note: the _changed? methods for attributes don't work in the
  # after_commit callback;
  # note: the & operator interestects the arrays, returning any values
  # that exist in both
  after_commit on: :update do
    expire_story_tile_fragment_cache
    expire_stories_index_fragment_cache
    expire_filter_select_fragment_cache
    expire_all_stories_cache(true)
  end if Proc.new { |story|
            (story.previous_changes.keys & ['published', 'logo_published']).any?
          }

  after_commit :expire_story_video_info_cache,
               :expire_story_video_xs_fragment_cache, on: :update, if:
        Proc.new { |story|
          story.previous_changes.key?('embed_url')
        }

  after_commit :expire_story_testimonial_fragment_cache, on: :update, if:
        Proc.new { |story|
          (story.previous_changes.keys & ['embed_url', 'quote', 'quote_attr']).any?
        }

  after_commit :expire_csp_story_path_cache,
               :expire_story_narration_fragment_cache,
               :expire_prev_next_fragment_cache, on: :update, if:
        Proc.new { |story| story.previous_changes.key?('title') }

  after_commit :expire_story_narration_fragment_cache, on: :update, if:
        Proc.new { |story|
          (story.previous_changes.keys & ['title', 'content']).any?
        }

  # method takes an active record relation
  def self.order stories_relation
    stories_relation
      .order("stories.published DESC, stories.publish_date ASC")
      .order("stories.updated_at DESC")
  end

  def should_generate_new_friendly_id?
    new_record? || title_changed? || slug.blank?
  end

  def scrub_html_input
    white_list_sanitizer = Rails::Html::WhiteListSanitizer.new
    self.content = white_list_sanitizer.sanitize(content, tags: %w(a p span strong i u blockquote pre font h1 h2 h3 h4 h5 h6 table tr td ol ul li hr img), attributes: %w(id class style face href src))
  end

  def assign_tags new_story
    if new_story[:category_tags]
      new_story[:category_tags].each do |selection|
        if selection.to_i == 0   # if it's a generic tag
          # create a new company category category based on the generic tag
          self.success.story_categories << StoryCategory.create(
              name: selection, company_id: current_user.company.id)
        else  # selection is the id of an existing company story category
          self.success.story_categories << StoryCategory.find(selection)
        end
      end
    end
    if new_story[:product_tags]
      new_story[:product_tags].each do |selection|
        self.success.products << Product.find(selection)
      end
    end
  end

  def update_tags company, new_tags
    existing_category_tags = self.success.story_categories
    existing_product_tags = self.success.products
    category_tags_changed = false
    product_tags_changed = false

    # remove deleted category tags ...
    existing_category_tags.each do |category|
      unless (new_tags.try(:[], :category_tags)) &&
          (new_tags.try(:[], :category_tags).include? category.id.to_s)
        StoryCategoriesSuccess.where("success_id = ? AND story_category_id = ?",
                                self.success.id, category.id)[0].destroy
        category_tags_changed = true
      end
    end
    # add new category tags ...
    unless new_tags.try(:[], :category_tags).nil?
      new_tags[:category_tags].each do |category_id|
        unless existing_category_tags.any? { |category| category.id == category_id.to_i }
          self.success.story_categories << StoryCategory.find(category_id.to_i)
          category_tags_changed = true
        end
      end
    end

    # remove deleted product tags ...
    existing_product_tags.each do |product|
      unless (new_tags.try(:[], :product_tags)) &&
          (new_tags.try(:[], :product_tags).include? product.id.to_s)
        ProductsSuccess.where("success_id = ? AND product_id = ?",
                                  self.success.id, product.id)[0].destroy
        product_tags_changed = true
      end
    end

    # add new product tags ...
    unless new_tags.try(:[], :product_tags).nil?
      new_tags[:product_tags].each do |product_id|
        unless existing_product_tags.any? { |product| product.id == product_id.to_i }
          self.success.products << Product.find(product_id.to_i)
          product_tags_changed = true
        end
      end
    end

    # expire cache
    if category_tags_changed
      company.expire_all_stories_cache(true)  # json only
      if self.logo_published?
        company.increment_public_category_select_fragments_memcache_iterator
      end
    end
    if product_tags_changed
      company.expire_all_stories_cache(true)  # json only
      self.expire_csp_story_path_cache
      if self.logo_published?
        company.increment_public_product_select_fragments_memcache_iterator
      end
    end

  end

  # method returns a friendly id path that either contains or omits a product
  def csp_story_path
    company = self.success.customer.company
    Rails.cache.fetch("#{company.subdomain}/csp-story-#{self.id}-path") do
      url_helpers = Rails.application.routes.url_helpers
      success = self.success
      if success.products.present?
        url_helpers.public_story_path(success.customer.slug,
                                      success.products.take.slug,
                                      self.slug)
      else
        url_helpers.public_story_no_product_path(success.customer.slug,
                                                 self.slug)
      end
    end
  end

  def expire_csp_story_path_cache
    company = self.success.customer.company
    company.expire_all_stories_cache(true)  # => json only
    Rails.cache.delete("#{company.subdomain}/csp-story-#{self.id}-path")
    self.expire_fragment_cache_on_path_change
  end

  # method returns a friendly id url that either contains or omits a product
  def csp_story_url
    url_helpers = Rails.application.routes.url_helpers
    success = self.success
    company = success.customer.company
    if success.products.present?
      url_helpers.public_story_url(
                    success.customer.slug,
                    success.products.take.slug,
                    self.slug,
                    subdomain: company.subdomain )
    else
      url_helpers.public_story_no_product_url(
                    success.customer.slug,
                    self.slug,
                    subdomain: company.subdomain )
    end
  end

  # defining this method makes it easy to include the edit_story_path helper
  # with activity feed response (contributions_submitted and contribution_requests_received)
  def csp_edit_story_path
    url_helpers = Rails.application.routes.url_helpers
    url_helpers.edit_story_path(self.id)
  end

  ##
  #  embed_url looks like one of these ...
  #
  #  "https://www.youtube.com/embed/#{youtube_id}"
  #  "https://player.vimeo.com/video/#{vimeo_id}"
  #  "https://fast.wistia.com/embed/medias/#{wistia_id}.jsonp"
  #
  def video_info
    company = self.success.customer.company
    Rails.cache.fetch("#{company.subdomain}/story-#{self.id}-video-info") do
      return { provider: nil, id: nil } if self.embed_url.blank?
      if self.embed_url.include? "youtube"
        { provider: 'youtube',
          id: embed_url.slice(embed_url.rindex('/') + 1, embed_url.length) }
      elsif self.embed_url.include? "vimeo"
        { provider: 'vimeo',
          id: embed_url.slice(embed_url.rindex('/') + 1, embed_url.length) }
      elsif self.embed_url.include? "wistia"
        { provider: 'wistia',
          id: self.embed_url.match(/\/(?<id>\w+)(\.\w+$)/)[:id] }
      else
        # error
      end
    end
  end

  def contributions_pre_request
    Contribution
      .story_all(self.id)
      .includes(:contributor, :referrer)
      .where(status: 'pre_request')
      .order(created_at: :desc)  # most recent first
  end

  # sort oldest to newest (according to status)
  def contributions_in_progress
    status_options = ['opt_out', 'unsubscribe', 'remind2', 'remind1', 'request', 're_send']
    Contribution
      .story_all(self.id)
      .includes(:contributor, :referrer)
      .where('status IN (?)', status_options)
      .sort do |a,b|  # sorts as per order of status_options
        if status_options.index(a.status) < status_options.index(b.status)
          -1
        elsif status_options.index(a.status) > status_options.index(b.status)
          1
        else 0
        end
      end
  end

  def contributions_next_steps
    Contribution
      .story_all(self.id)
      .includes(:contributor, :referrer)
      .where('status IN (?)', ['feedback', 'did_not_respond'])
      .order("CASE status
                WHEN 'feedback' THEN '1'
                WHEN 'did_not_respond' THEN '2'
              END")
  end

  def contributions_submitted
    Contribution
      .story_all(self.id)
      .includes(:contributor, :referrer)
      .where(status: 'contribution')
      .order(submitted_at: :desc)
  end

  def contributions_as_connections
    Contribution
      .story_all_except_curator(self.id, self.success.curator.id)
      .includes(:contributor, :referrer)
      .where.not("status IN ('unsubscribe', 'opt_out')")
      .order("CASE role
                WHEN 'customer' THEN '1'
                WHEN 'partner' THEN '2'
                WHEN 'sales' THEN '3'
              END")
  end

  # this method closely resembles the 'set_contributors' method in stories controller;
  # adds contributor linkedin data, which is necessary client-side for widgets
  # that fail to load
  def published_contributors
    company = self.success.customer.company
    Rails.cache.fetch("#{company.subdomain}/story-#{self.id}-published-contributors") do
      curator = self.success.curator
      contributors =
        User.joins(own_contributions: { success: {} })
            .where.not(linkedin_url:'')
            .where(successes: { id: self.success_id },
                   contributions: { publish_contributor: true })
            .order("CASE contributions.role
                      WHEN 'customer' THEN '1'
                      WHEN 'partner' THEN '2'
                      WHEN 'sales' THEN '3'
                    END")
            .map do |contributor|
               { widget_loaded: false,
                 id: contributor.id,
                 first_name: contributor.first_name,
                 last_name: contributor.last_name,
                 linkedin_url: contributor.linkedin_url,
                 linkedin_photo_url: contributor.linkedin_photo_url,
                 linkedin_title: contributor.linkedin_title,
                 linkedin_company: contributor.linkedin_company,
                 linkedin_location: contributor.linkedin_location }
             end
      contributors.delete_if { |c| c[:id] == curator.id }
      # don't need the id anymore, don't want to send it to client ...
      contributors.map! { |c| c.except(:id) }
      if curator.linkedin_url.present?
        contributors.push({ widget_loaded: false }
                    .merge(self.success.curator.slice(
                      :first_name, :last_name, :linkedin_url, :linkedin_photo_url,
                      :linkedin_title, :linkedin_company, :linkedin_location )))
      end
      contributors
    end
  end

  def expire_published_contributor_cache contributor_id
    company = self.success.customer.company
    Rails.cache.delete("#{company.subdomain}/story-#{self.id}-published-contributors")
    company.expire_all_stories_cache(true)  # json only
    self.expire_fragment("#{company.subdomain}/story-#{self.id}-contributors")
    self.expire_fragment(
      "#{company.subdomain}/story-#{self.id}-contributor-#{contributor_id}")
  end

  # expire fragment cache for a single story tile (curator and public)
  def expire_story_tile_fragment_cache
    company = self.success.customer.company
    memcache_iterator =
      "memcache-iterator-#{company.story_tile_fragments_memcache_iterator}"
    curator_tile_fragment = "#{company.subdomain}/curator-story-tile-" +
                            "#{self.id}-#{memcache_iterator}"
    public_tile_fragment = "#{company.subdomain}/public-story-tile-" +
                           "#{self.id}-#{memcache_iterator}"
    self.expire_fragment(curator_tile_fragment)
    # public tile fragment will not exist if this is first time logo published
    self.expire_fragment(public_tile_fragment) if fragment_exist?(public_tile_fragment)
  end

  # expire fragment cache for the stories index (gallery of tiles)
  def expire_stories_index_fragment_cache
    company = self.success.customer.company
    categories = self.success.story_categories
    products = self.success.products
    csimi = "memcache-iterator-" +
            "#{company.curator_stories_index_fragments_memcache_iterator}"
    psimi = "memcache-iterator-" +
            "#{company.public_stories_index_fragments_memcache_iterator}"

    # expire curator-stories-index-all-0 (all story tiles)
    self.expire_fragment("#{company.subdomain}/curator-stories-index-all-0-#{csimi}")
    # expire public-stories-index-all-0
    self.expire_fragment("#{company.subdomain}/public-stories-index-all-0-#{psimi}")

    categories.each do |category|
      # expire curator-stories-index-category-xx,
      self.expire_fragment(
        "#{company.subdomain}/curator-stories-index-category-#{category.id}-#{csimi}")
      # expire public-stories-index-product-xx,
      self.expire_fragment(
        "#{company.subdomain}/public-stories-index-category-#{category.id}-#{psimi}")
    end

    products.each do |product|
      # expire curator-stories-index-product-xx,
      self.expire_fragment(
        "#{company.subdomain}/curator-stories-index-product-#{product.id}-#{csimi}")
      # expire public-stories-index-category-xx,
      self.expire_fragment(
        "#{company.subdomain}/public-stories-index-product-#{product.id}-#{psimi}")
    end
  end

  def expire_filter_select_fragment_cache
    success = self.success
    company = success.customer.company
    if success.story_categories.present?
      company.increment_public_category_select_fragments_memcache_iterator
    end
    if success.products.present?
      company.increment_public_product_select_fragments_memcache_iterator
    end
  end

  def expire_fragment_cache_on_path_change
    company = self.success.customer.company
    self.expire_prev_next_fragment_cache
    if self.logo_published
      self.expire_story_tile_fragment_cache
      self.expire_fragment(
        "#{company.subdomain}/curator-stories-index-all-0-memcache-iterator-" +
        "#{company.curator_stories_index_fragments_memcache_iterator}")
      self.expire_fragment(
        "#{company.subdomain}/public-stories-index-all-0-memcache-iterator-" +
        "#{company.public_stories_index_fragments_memcache_iterator}")
      self.success.story_categories.each do |category|
        self.expire_fragment(
          "#{company.subdomain}/curator-stories-index-category-#{category.id}-" +
          "memcache-iterator-#{company.curator_stories_index_fragments_memcache_iterator}")
        self.expire_fragment(
          "#{company.subdomain}/public-stories-index-category-#{category.id}-" +
          "memcache-iterator-#{company.public_stories_index_fragments_memcache_iterator}")
      end
      self.success.products.each do |product|
        self.expire_fragment(
          "#{company.subdomain}/curator-stories-index-product-#{product.id}-" +
          "memcache-iterator-#{company.curator_stories_index_fragments_memcache_iterator}")
        self.expire_fragment(
          "#{company.subdomain}/public-stories-index-product-#{product.id}-" +
          "memcache-iterator-#{company.public_stories_index_fragments_memcache_iterator}")
      end
    end
  end

  def expire_all_stories_cache json_only
    company = self.success.customer.company
    company.expire_all_stories_cache(json_only)
  end

  def expire_story_testimonial_fragment_cache
    company = self.success.customer.company
    self.expire_fragment("#{company.subdomain}/story-#{self.id}-testimonial")
  end

  def expire_story_video_info_cache
    company = self.success.customer.company
    Rails.cache.delete("#{company.subdomain}/story-#{self.id}-video-info")
  end

  def expire_story_video_xs_fragment_cache
    company = self.success.customer.company
    self.expire_fragment("#{company.subdomain}/story-#{self.id}-video-xs")
  end

  def expire_story_narration_fragment_cache
    company = self.success.customer.company
    self.expire_fragment("#{company.subdomain}/story-#{self.id}-narration")
  end

  def expire_results_fragment_cache
    company = self.success.customer.company
    self.expire_fragment("#{company.subdomain}/story-#{self.id}-results")
  end

  def prev_next_memcache_iterator
    company = self.success.customer.company
    Rails.cache.fetch(
      "#{company.subdomain}/story-#{self.id}-prev-next-memcache-iterator") { rand(10) }
  end

  def increment_prev_next_memcache_iterator
    company = self.success.customer.company
    Rails.cache.write(
      "#{company.subdomain}/story-#{self.id}-prev-next-memcache-iterator",
      self.prev_next_memcache_iterator + 1)
  end

  # previous/next story navigation
  def expire_prev_next_fragment_cache
    company = self.success.customer.company
    self.expire_fragment("#{company.subdomain}/prev_story_#{self.id}")
    self.expire_fragment("#{company.subdomain}/next_story_#{self.id}")
    # expire the above's parent fragment(s)
    self.increment_prev_next_memcache_iterator
  end

  def contributors_jsonld
    self.success.contributors.map do |contributor|
                                { "@type" => "Person",
                                  "name" => contributor.full_name }
                              end
  end

  def about_jsonld
    customer = self.success.customer
    [{ "@type" => "Corporation",
       "name" => customer.name,
       "logo" => { "@type" => "ImageObject",
       "url" => customer.logo_url }}] +
      self.success.products.map do |product|
                              { "@type" => "Product",
                                "name" => product.name }
                            end
  end

  def previous is_curator
    company = self.success.customer.company
    all_stories = company.all_stories
    published_stories = company.published_stories
    if is_curator
      prev_story_index = all_stories.index(self.id) - 1
      prev_story_index = (all_stories.length - 1) if prev_story_index == 0
      Story.find(all_stories[prev_story_index])
    else
      prev_story_index = published_stories.index(self.id) - 1
      prev_story_index = published_stories.length - 1 if prev_story_index == 0
      Story.find(published_stories[prev_story_index])
    end
  end

  def next is_curator
    company = self.success.customer.company
    all_stories = company.all_stories
    published_stories = company.published_stories
    if is_curator
      next_story_index = all_stories.index(self.id) + 1
      next_story_index = 0 if next_story_index == all_stories.length
      Story.find(all_stories[next_story_index])
    else
      next_story_index = published_stories.index(self.id) + 1
      next_story_index = 0 if next_story_index == published_stories.length
      Story.find(published_stories[next_story_index])
    end
  end

  # not currently used, maybe include with json api
  # def published_tags
  #   return nil unless self.published?
  #   { categories: self.success.story_categories.map { |c| { name: c.name, slug: c.slug } },
  #     products: self.success.products.map { |p| { name: p.name, slug: p.slug } }}
  # end

  # # not currently used, maybe include with json api
  # def published_content
  #   return nil unless self.published?
  #   { title: title,
  #     quote: quote,
  #     quote_attr: quote_attr,
  #     content: content }
  # end

  def related_stories
    related_stories = []
    same_product_stories = []
    same_category_stories = []
    success = self.success
    company = success.customer.company
    published_stories = company.published_stories
    success.products.each do |product|
      same_product_stories += company.published_stories_filter_product(product.id)
    end
    success.story_categories.each do |category|
      same_category_stories += company.published_stories_filter_category(category.id)
    end
    same_tag_stories = (same_product_stories + same_category_stories).uniq
    if same_product_stories.length >= 3
      related_stories = same_product_stories.sample(3)
    elsif same_tag_stories.length >= 3
      related_stories = same_tag_stories.sample(3)
    elsif same_tag_stories.length == 0
      related_stories = published_stories.sample(3)
    else
      related_stories = same_tag_stories +
                        published_stories.sample(3 - same_tag_stories.length)
    end
    Story.find(related_stories)
  end

end
