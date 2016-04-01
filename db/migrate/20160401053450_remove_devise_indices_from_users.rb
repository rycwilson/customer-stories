class RemoveDeviseIndicesFromUsers < ActiveRecord::Migration

  def change
    remove_index :users, column: :reset_password_token
    remove_index :users, column: :unlock_token
    remove_index :admins, column: :reset_password_token
  end

end
