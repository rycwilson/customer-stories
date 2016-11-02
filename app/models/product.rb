class Product < ActiveRecord::Base

  include FriendlyId

  belongs_to :company
  has_many :products_successes, dependent: :destroy
  has_many :successes, through: :products_successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id
  # validates :description, presence: true

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit :delete_cache

  def delete_cache
    company = self.success.customer.company
    Rails.cache.delete("#{company.subdomain}/product_select_options")
    Rails.cache.delete("#{company.subdomain}/public_product_select_options")
    Rails.cache.delete("views/#{company.subdomain}/curator_story_filters")
    Rails.cache.delete("views/#{company.subdomain}/public_story_filters")
  end

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

end
