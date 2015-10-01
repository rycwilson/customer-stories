class Customer < ActiveRecord::Base

  belongs_to :company
  has_many :successes, dependent: :destroy

end
