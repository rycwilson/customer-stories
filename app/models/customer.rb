class Customer < ActiveRecord::Base

  include FriendlyId

  belongs_to :company
  has_many :successes, dependent: :destroy
  has_many :stories, through: :successes
  has_many :contributions, through: :successes
  has_many :contributors, through: :contributions, class_name: 'User', foreign_key: 'user_id'
  #   def select2_options ()
  #     self.map { |contributor| { id: contributor.id, text: contributor.full_name } }
  #         .unshift({ id: 0, text: '- New Contributor -' })
  #   end
  # end

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit :expire_fragment_cache_on_logo_change,
               :expire_all_stories_json_cache, on: :update,
        if: Proc.new { |customer| customer.previous_changes.key?(:logo_url) }

  after_commit(on: [:update]) do  # also calls story.expire_all_stories_cache
    expire_csp_story_path_cache
  end if Proc.new { |customer| customer.previous_changes.key?(:name) }

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

  def expire_fragment_cache_on_logo_change
    # memcache iterator necessary in case change in company colors expires all index cache
    mi = self.company.stories_index_fragments_memcache_iterator
    # expire stories-index-all-0 if any logo_published stories exist for this customer
    if Story.joins(success: {})
            .where(logo_published: true, successes: { customer_id: self.id })
            .present?
      self.expire_fragment(
        "#{company.subdomain}/stories-index-all-0-memcache-iterator-#{mi}"
      )
    end
    self.successes.each do |success|
      story = success.story
      self.expire_fragment("#{self.company.subdomain}/story-#{story.id}-testimonial")
      if story.logo_published?
        # expire story tile fragments ...
        self.expire_fragment(
          "#{self.company.subdomain}/story-tile-#{story.id}-" +
          "memcache-iterator-#{self.company.story_tile_fragments_memcache_iterator}")
        # expire stories index fragments for affected filters ...
        success.story_categories.each do |category|
          self.expire_fragment(
            "#{self.company.subdomain}/stories-index-category-#{category.id}-#{mi}"
          )
        end
        success.products.each do |product|
          self.expire_fragment(
            "#{self.company.subdomain}/stories-index-product-#{product.id}-#{mi}"
          )
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
