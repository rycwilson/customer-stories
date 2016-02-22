class Customer < ActiveRecord::Base

  belongs_to :company
  has_many :successes, dependent: :destroy
  has_many :stories, through: :successes

  validates :name, presence: true

end
