class Product < ActiveRecord::Base

  include FriendlyId

  belongs_to :company
  has_many :products_successes, dependent: :destroy
  has_many :successes, through: :products_successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id
  # validates :description, presence: true

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit :expire_fragment_cache, on: [:create, :destroy]

  # curator product select fragments (all and pre-selected) invalidated by:
  # -> create/delete company tags
  # public product select fragments (all and pre-selected) invalidated by:
  # -> attach/detach tags IF the story has logo published (see story.update_tags)
  # -> story publish state IF story is tagged
  #    (see story.expire_filter_select_fragment_cache)
  def expire_fragment_cache
    company = self.success.customer.company
    company.increment_curator_product_select_fragments_memcache_iterator
  end

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

end
