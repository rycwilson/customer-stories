class Customer < ActiveRecord::Base

  include FriendlyId

  belongs_to :company
  has_many :successes, dependent: :destroy
  has_many :stories, through: :successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit :invalidate_cache_keys, on: :update,
    if: Proc.new { |customer| customer.previous_changes.key?('logo_url') }

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

  def invalidate_cache_keys
    self.successes.each do |success|
      success.story.invalidate_story_tile_cache_keys
    end
    company.increment_stories_index_memcache_iterator
  end

end
