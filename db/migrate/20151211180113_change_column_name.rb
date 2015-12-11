class ChangeColumnName < ActiveRecord::Migration

  def self.up
    rename_column :contributions, :state, :status
  end

  def self.down
    rename_column :contributions, :status, :state
  end

end
