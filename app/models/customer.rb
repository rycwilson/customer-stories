class Customer < ActiveRecord::Base

  include FriendlyId

  belongs_to :company
  has_many :successes, dependent: :destroy
  has_many :stories, through: :successes
  has_many :contributions, through: :successes
  has_many :contributors, -> { distinct }, through: :contributions, source: :contributor

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit(on: :update) do
    expire_fragment_cache_on_logo_change
    self.company.expire_stories_json_cache
  end if Proc.new do |customer|
      customer.previous_changes.any? do |k, v|
        [:logo_url, :show_name_with_logo].include?(k)
      end
    end

  after_commit(on: [:update]) do
    self.stories.each { |story| story.expire_csp_story_path_cache }
  end if Proc.new { |customer| customer.previous_changes.key?(:name) }

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

  def expire_fragment_cache_on_logo_change
    self.stories.each do |story|
      self.expire_fragment("#{self.company.subdomain}/story-#{story.id}-testimonial")
      if story.logo_published?
        # expire unfiltered gallery
        self.expire_fragment(
          "#{self.company.subdomain}/stories-gallery-" +
          "memcache-iterator-#{self.company.stories_gallery_fragments_memcache_iterator}"
        )
        # expire story card fragments
        self.expire_fragment(
          "#{self.company.subdomain}/story-card-#{story.id}-" +
          "memcache-iterator-#{self.company.story_card_fragments_memcache_iterator}"
        )
        # expire stories gallery fragments for affected filters
        story.category_tags.each do |tag|
          self.expire_fragment(
            "#{self.company.subdomain}/stories-gallery-category-#{tag.id}-" +
            "memcache-iterator-#{self.company.stories_gallery_fragments_memcache_iterator}"
          )
        end
        story.product_tags.each do |tag|
          self.expire_fragment(
            "#{self.company.subdomain}/stories-gallery-product-#{tag.id}-" +
            "memcache-iterator-#{self.company.stories_gallery_fragments_memcache_iterator}"
          )
        end
      end
    end
  end

end
