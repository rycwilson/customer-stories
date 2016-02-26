class RenamePromptField < ActiveRecord::Migration

  def change
    rename_column :prompts, :body, :description
  end

end
