class AddWinStoryCompleteToSuccesses < ActiveRecord::Migration[5.0]
  def change
    add_column :successes, :win_story_completed, :boolean, default: false
  end
end
