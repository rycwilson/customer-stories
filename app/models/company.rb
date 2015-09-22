class Company < ActiveRecord::Base

  validates :name, uniqueness: true

  has_many :customers, dependent: :destroy
  has_many :successes, through: :customers

end
