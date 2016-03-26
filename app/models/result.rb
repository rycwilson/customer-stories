class Result < ActiveRecord::Base

  belongs_to :success

  validates :description, presence: true
  validates :description, length: { maximum: 70 }

end
