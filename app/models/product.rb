class Product < ActiveRecord::Base

  validates :name, presence: true, uniqueness: true
  # validates :description, presence: true

  belongs_to :company
  has_many :products_successes, dependent: :destroy
  has_many :successes, through: :products_successes

end
