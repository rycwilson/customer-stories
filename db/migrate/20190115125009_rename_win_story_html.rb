class RenameWinStoryHtml < ActiveRecord::Migration[5.0]
  def change
    rename_column(:successes, :win_story, :win_story_html)
  end
end
