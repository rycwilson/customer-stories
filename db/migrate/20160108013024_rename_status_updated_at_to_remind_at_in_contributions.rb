class RenameStatusUpdatedAtToRemindAtInContributions < ActiveRecord::Migration
  def change
    rename_column :contributions, :status_updated_at, :remind_at
  end
end
