class Result < ActiveRecord::Base

  belongs_to :success

  validates :description, presence: true

end
