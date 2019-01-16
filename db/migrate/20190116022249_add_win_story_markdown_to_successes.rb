class AddWinStoryMarkdownToSuccesses < ActiveRecord::Migration[5.0]
  def change
    add_column :successes, :win_story_markdown, :text
  end
end
