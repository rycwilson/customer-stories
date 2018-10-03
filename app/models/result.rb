class Result < ApplicationRecord

  belongs_to :success
  has_one :story, through: :success
  has_one :customer, through: :success

  validates :description, presence: true
  validates :description, length: { maximum: 70 }

  after_commit :expire_results_fragment_cache, on: [:create, :update, :destroy]

  def expire_results_fragment_cache
    story = self.story
    story.expire_results_fragment_cache
  end

end
