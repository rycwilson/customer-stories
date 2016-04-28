class RemoveIsAdminFromUsers < ActiveRecord::Migration
  def change
    remove_column :users, :is_admin, :boolean
  end
end
