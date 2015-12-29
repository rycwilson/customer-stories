class Success < ActiveRecord::Base

  belongs_to :company
  belongs_to :customer
  belongs_to :user  # the curator
  # alias the user attribute -> Success.find(id).curator
  alias_attribute :curator, :user

  has_one :story, dependent: :destroy
  has_many :visitors, dependent: :destroy
  has_many :products_successes, dependent: :destroy
  has_many :products, through: :products_successes
  has_many :product_cats_successes, dependent: :destroy
  has_many :product_categories, through: :product_cats_successes
  has_many :industries_successes, dependent: :destroy
  has_many :industry_categories, through: :industries_successes
  has_many :contributions, dependent: :destroy
  # alias the association to user -> Success.find(id).contributors
  has_many :contributors, through: :contributions, source: :user

end

