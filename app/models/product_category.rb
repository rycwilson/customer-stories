class ProductCategory < ActiveRecord::Base

  validates :name, presence: true, uniqueness: true

  belongs_to :company
  has_many :product_cats_successes, dependent: :destroy
  has_many :successes, through: :product_cats_successes

end
