class Product < ApplicationRecord

  include FriendlyId

  belongs_to :company
  has_many :products_successes, dependent: :destroy
  has_many :successes, through: :products_successes
  has_many :stories, through: :successes
  has_many :customers, through: :successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id
  # validates :description, presence: true

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  after_commit do 
    self.company.expire_fragment_cache('plugin-config')
    self.company.expire_fragment_cache('story-tags')
  end

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

end
