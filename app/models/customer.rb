class Customer < ApplicationRecord

  include FriendlyId

  belongs_to :company
  has_many :successes, dependent: :destroy
  has_many :stories, through: :successes
  has_many :contributions, through: :successes
  has_many :contributors, -> { distinct }, through: :contributions

  validates :name, presence: true, uniqueness: { scope: :company_id }

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_update_commit(unless: -> { skip_callbacks }) do
    # expire_cache if (self.previous_changes.keys & ['name', 'logo_url', 'show_name_with_logo']).any?
    logo_was_updated = previous_changes.keys.include?('logo_url') && previous_changes[:logo_url].first.present?
    puts "logo_was_updated? #{logo_was_updated}"
    if logo_was_updated
      # S3Util::delete_object(S3_BUCKET, previous_changes[:logo_url].first)
    end
  end

  attr_accessor :skip_callbacks

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

  def expire_cache
    # expire_story_fragments
    # self.stories.each { |story| story.expire_csp_story_path_cache }
    # self.company.expire_fragment_cache('plugin-config')
    # self.company.expire_ll_cache('successes-json', 'contributions-json', 'stories-json')
  end

  def expire_story_fragments
    self.stories.each do |story|
      self.expire_fragment("#{self.company.subdomain}/stories/#{story.id}/testimonial")
      self.expire_fragment("#{self.company.subdomain}/stories/#{story.id}/cs-testimonial")
      if story.logo_published?
        # expire unfiltered gallery
        self.expire_fragment(
          "#{self.company.subdomain}/stories-gallery-memcache-iterator-#{self.company.stories_gallery_fragments_memcache_iterator}"
        )
        # expire story card fragments
        self.expire_fragment(
          "#{self.company.subdomain}/story-card-#{story.id}-memcache-iterator-#{self.company.story_card_fragments_memcache_iterator}"
        )
        # expire stories gallery fragments for affected filters
        story.category_tags.each do |tag|
          self.expire_fragment(
            "#{self.company.subdomain}/stories-gallery-category-#{tag.id}-memcache-iterator-#{self.company.stories_gallery_fragments_memcache_iterator}"
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

  def name_with_stories_count
    "#{name} (#{stories.count})"
  end

end
