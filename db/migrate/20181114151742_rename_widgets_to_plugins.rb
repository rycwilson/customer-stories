class RenameWidgetsToPlugins < ActiveRecord::Migration[5.0]
  def change
    rename_table :widgets, :plugins
  end
end
