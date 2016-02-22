class RenameCuratorIdInSuccesses < ActiveRecord::Migration

  def change
    rename_column :successes, :user_id, :curator_id
  end

end
