class RenameAdminInUsers < ActiveRecord::Migration

  def change
    remove_column :users, :role
    add_column :users, :is_admin, :boolean, default: false
  end

end
