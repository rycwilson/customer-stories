class Company < ActiveRecord::Base

  validates :name, presence: true, uniqueness: true

  has_many :users, dependent: :destroy
  has_many :customers, dependent: :destroy
  has_many :successes, through: :customers
  has_many :stories, through: :successes
  has_many :industry_categories, dependent: :destroy
  has_many :product_categories, dependent: :destroy

end
