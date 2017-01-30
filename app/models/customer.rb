class Customer < ActiveRecord::Base

  include FriendlyId

  belongs_to :company
  has_many :successes, dependent: :destroy
  has_many :stories, through: :successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit :expire_fragment_cache_on_logo_change,
               :expire_all_stories_json_cache, on: :update,
        if: Proc.new { |customer| customer.previous_changes.key?(:logo_url) }

  after_commit :expire_csp_story_path_cache, on: :update,  # also calls story.expire_all_stories_cache
    if: Proc.new { |customer| customer.previous_changes.key?(:name) }

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

  def expire_fragment_cache_on_logo_change
    company = self.company
    successes = self.successes
    # memcache iterator necessary in case change in company colors expires
    # all index cache
    csimi = "memcache-iterator-" +
            "#{company.curator_stories_index_fragments_memcache_iterator}"
    psimi = "memcache-iterator-" +
            "#{company.public_stories_index_fragments_memcache_iterator}"

    # expire curator-stories-index-all-0
    self.expire_fragment("#{company.subdomain}/curator-stories-index-all-0-#{csimi}")

    # expire public-stories-index-all-0 if any logo_published stories
    # exist for this customer
    if Story.joins(success: {})
            .where(logo_published: true, successes: { customer_id: self.id })
            .present?
      self.expire_fragment(
        "#{company.subdomain}/public-stories-index-all-0-#{psimi}")
    end

    successes.each do |success|
      story = success.story
      # testimonial and prev-next fragments
      self.expire_fragment("#{company.subdomain}/story-#{story.id}-testimonial")
      story.expire_prev_next_fragment_cache

      # curator
      # story tile fragment
      self.expire_fragment(
        "#{company.subdomain}/curator-story-tile-#{story.id}-" +
        "memcache-iterator-#{company.story_tile_fragments_memcache_iterator}")
      # expire stories index fragments for affected filters ...
      success.story_categories.each do |category|
        self.expire_fragment(
          "#{company.subdomain}/curator-stories-index-category-#{category.id}-#{csimi}")
      end
      success.products.each do |product|
        self.expire_fragment(
          "#{company.subdomain}/curator-stories-index-product-#{product.id}-#{csimi}")
      end # curator

      # public
      if story.logo_published?
        # expire story tile fragments ...
        self.expire_fragment(
          "#{company.subdomain}/public-story-tile-#{story.id}-" +
          "memcache-iterator-#{company.story_tile_fragments_memcache_iterator}")
        # expire stories index fragments for affected filters ...
        success.story_categories.each do |category|
          self.expire_fragment(
            "#{company.subdomain}/public-stories-index-category-#{category.id}-#{psimi}")
        end
        success.products.each do |product|
          self.expire_fragment(
            "#{company.subdomain}/public-stories-index-product-#{product.id}-#{psimi}")
        end
      end

    end
  end

  def expire_csp_story_path_cache
    self.successes.each do |success|
      success.story.expire_csp_story_path_cache
    end
  end

  def expire_all_stories_json_cache
    self.company.expire_all_stories_cache(true)  # true => expire json only
  end

end
