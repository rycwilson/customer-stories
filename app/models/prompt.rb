class Prompt < ApplicationRecord

  belongs_to :success

  validates :description, presence: true

end
