class Product < ApplicationRecord
  include FriendlyId

  belongs_to :company
  has_and_belongs_to_many :successes
  has_and_belongs_to_many :contributor_prompts, dependent: :destroy
  has_many :stories, through: :successes
  has_many :customers, through: :successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id
  # validates :description, presence: true

  friendly_id :name, use: [:slugged, :scoped], scope: :company_id

  scope(:featured, -> { joins(:stories).merge(Story.featured).distinct })

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end
end
