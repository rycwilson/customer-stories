class Tag < ApplicationRecord
  include FriendlyId

  belongs_to :company
  has_and_belongs_to_many :successes
  has_and_belongs_to_many :contributor_questions
  has_many :stories, through: :successes

  validates :name, presence: true, uniqueness: { scope: [:company, :type] }

  scope :featured, -> { joins(:stories).merge(Story.featured.reorder(nil)).distinct }

  friendly_id :name, use: %i[slugged scoped], scope: :company_id

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end
end
