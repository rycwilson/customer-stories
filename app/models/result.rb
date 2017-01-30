class Result < ActiveRecord::Base

  belongs_to :success

  validates :description, presence: true
  validates :description, length: { maximum: 70 }

  after_commit :expire_results_fragment_cache, on: [:update, :destroy]

  def expire_results_fragment_cache
    story = self.success.story
    story.expire_results_fragment_cache
  end

end
