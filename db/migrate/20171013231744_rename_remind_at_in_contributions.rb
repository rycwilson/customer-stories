class RenameRemindAtInContributions < ActiveRecord::Migration
  def change
    rename_column(:contributions, :remind_at, :request_remind_at)
  end
end
