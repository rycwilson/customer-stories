class RenameDescriptionToWinStoryInSuccesses < ActiveRecord::Migration[5.0]
  def change
    rename_column(:successes, :description, :win_story)
  end
end
