class RenameColumnInVisitorActions < ActiveRecord::Migration

  def change
    rename_column :visitor_actions, :share_network, :description
  end

end
