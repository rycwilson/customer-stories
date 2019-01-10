class AddWinStoryTextToSuccesses < ActiveRecord::Migration[5.0]
  def change
    add_column :successes, :win_story_text, :text
  end
end
