class Result < ApplicationRecord
  # belongs_to :success   # leave this in place until production db is migrated!
  belongs_to :story
  default_scope { order(created_at: :asc) }
  validates :description, presence: true, length: { maximum: 70 }
end
