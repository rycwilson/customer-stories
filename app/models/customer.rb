class Customer < ActiveRecord::Base

  belongs_to :company
  has_many :successes, dependent: :destroy
  has_many :product_categories, dependent: :destroy

end
