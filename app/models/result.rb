class Result < ApplicationRecord
  belongs_to :story
  default_scope { order(created_at: :asc) }
  validates :description, presence: true, length: { maximum: 70 }
end