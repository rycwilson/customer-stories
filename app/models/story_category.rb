class StoryCategory < ActiveRecord::Base

  include FriendlyId

  belongs_to :company

  has_many :story_categories_successes, dependent: :destroy
  has_many :successes, through: :story_categories_successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit :invalidate_cache_keys  # create, destroy, modify tag

  def invalidate_cache_keys
    company = self.success.customer.company

    # Rails.cache.delete("#{company.subdomain}/category-select-options")
    # Rails.cache.delete("#{company.subdomain}/public-category-select_options")
    # expire_fragment("#{company.subdomain}/curator_category_filters/")
    # expire_fragment("#{company.subdomain}/public_story_filters")
  end

  def self.memcache_iterator(company)
    Rails.cache.fetch("#{company.subdomain}/category-select-memcache-iterator") { rand(10) }
  end

  def self.increment_memcache_iterator
    Rails.cache.write("story-category-memcache-iterator", self.memcache_iterator + 1)
  end

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

end
