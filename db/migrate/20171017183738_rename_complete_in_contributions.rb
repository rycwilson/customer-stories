class RenameCompleteInContributions < ActiveRecord::Migration
  def change
    rename_column(:contributions, :complete, :completed)
  end
end
