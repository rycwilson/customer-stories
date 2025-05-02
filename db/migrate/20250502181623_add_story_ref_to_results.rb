class AddStoryRefToResults < ActiveRecord::Migration[6.1]
  def change
    add_reference :results, :story, foreign_key: true

    Result.find_each do |result|
      success = result.success
      story = success&.story
      if story
        result.update!(story_id: story.id)
      else
        result.destroy!
      end
    end
  end
end
