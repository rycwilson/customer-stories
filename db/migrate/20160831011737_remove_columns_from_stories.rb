class RemoveColumnsFromStories < ActiveRecord::Migration
  def change
    remove_column :stories, :situation, :string
    remove_column :stories, :challenge, :string
    remove_column :stories, :solution, :string
    remove_column :stories, :benefits, :string
  end
end
