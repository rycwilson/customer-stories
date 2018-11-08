class RenameStoryNarrative < ActiveRecord::Migration[5.0]
  def change
    rename_column :stories, :content, :narrative
  end
end
