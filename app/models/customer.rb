class Customer < ActiveRecord::Base

  include FriendlyId

  belongs_to :company
  has_many :successes, dependent: :destroy
  has_many :stories, through: :successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit :expire_fragment_cache,
               :expire_all_stories_json_cache,
               :expire_story_testimonial_fragment_cache, on: :update,
    if: Proc.new { |customer| customer.previous_changes.key?('logo_url') }

  after_commit :expire_csp_story_path_cache,
               :expire_story_header_fragment_cache,
               :expire_all_stories_json_cache, on: :update,
    if: Proc.new { |customer| customer.previous_changes.key?('name') }

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

  def expire_fragment_cache
    company = self.company
    successes = self.successes
    csimi = "memcache-iterator-" +
            "#{company.curator_stories_index_fragments_memcache_iterator}"
    psimi = "memcache-iterator-" +
            "#{company.public_stories_index_fragments_memcache_iterator}"

    # expire curator-stories-index-all-0, public-stories-index-all-0
    self.expire_fragment(
      "#{company.subdomain}/curator-stories-index-all-0-#{csimi}")
    self.expire_fragment(
      "#{company.subdomain}/public-stories-index-all-0-#{psimi}")

    successes.each do |success|
      story = success.story
      if story.logo_published?
        # expire story tile fragments ...
        self.expire_fragment(
          "#{company.subdomain}/curator-story-tile-#{story.id}-" +
          "memcache-iterator-#{company.story_tile_fragments_memcache_iterator}")
        self.expire_fragment(
          "#{company.subdomain}/public-story-tile-#{story.id}-" +
          "memcache-iterator-#{company.story_tile_fragments_memcache_iterator}")
        # expire stories index fragments for affected filters ...
        success.story_categories.each do |category|
          self.expire_fragment(
            "#{company.subdomain}/curator-stories-index-category-#{category.id}-#{csimi}")
          self.expire_fragment(
            "#{company.subdomain}/public-stories-index-category-#{category.id}-#{psimi}")
        end
        success.products.each do |product|
          self.expire_fragment(
            "#{company.subdomain}/curator-stories-index-product-#{product.id}-#{csimi}")
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
    self.company.expire_all_stories_json_cache
  end

  def expire_story_header_fragment_cache
    company = self.company
    self.expire_fragment("#{company.subdomain}/story-#{@story.id}-header")
    self.expire_fragment("#{company.subdomain}/story-#{@story.id}-header-not-production")
  end

  def expire_story_testimonial_fragment_cache
    company = self.company
    self.successes.each do |success|
      self.expire_fragment("#{company.subdomain}/story-#{success.story.id}-testimonial")
    end
  end

end
