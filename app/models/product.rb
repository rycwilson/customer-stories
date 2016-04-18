class Product < ActiveRecord::Base

  include FriendlyId

  belongs_to :company
  has_many :products_successes, dependent: :destroy
  has_many :successes, through: :products_successes

  validates :name, presence: true
  validates_uniqueness_of :name, scope: :company_id
  # validates :description, presence: true

  friendly_id :name, use: [:slugged, :finders, :scoped], scope: :company_id

end
