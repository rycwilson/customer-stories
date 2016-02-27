class Result < ActiveRecord::Base

  belongs_to :success

  validates :description, presence: true
  validates :description, length: { maximum: 50 }

end
