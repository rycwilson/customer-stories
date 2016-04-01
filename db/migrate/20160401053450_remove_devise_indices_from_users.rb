class RemoveDeviseIndicesFromUsers < ActiveRecord::Migration

  def change
    remove_index :users, :reset_password_token
    remove_index :users, :unlock_token
    remove_index :admins, :reset_password_token
  end

end
