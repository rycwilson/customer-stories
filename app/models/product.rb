class Product < ActiveRecord::Base

  belongs_to :company

  validates :name, presence: true, uniqueness: true
  validates :description, presence: true

end
