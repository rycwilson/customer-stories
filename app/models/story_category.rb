class StoryCategory < ActiveRecord::Base

  include FriendlyId

  belongs_to :company

  has_many :story_categories_successes, dependent: :destroy
  has_many :successes, through: :story_categories_successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit :expire_fragment_cache, on: [:create, :destroy]  # company tags

  # curator category select fragments (all and pre-selected) expired by:
  # -> create/delete company tags
  # public category select fragments (all and pre-selected) expired by:
  # -> attach/detach tags IF the story has logo published (see story.update_tags)
  # -> story publish state IF story is tagged
  #    (see story.expire_filter_select_fragment_cache)
  def expire_fragment_cache
    company = self.success.customer.company
    company.increment_curator_category_select_fragments_memcache_iterator
  end

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

end
