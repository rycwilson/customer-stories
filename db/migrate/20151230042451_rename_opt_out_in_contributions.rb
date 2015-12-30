class RenameOptOutInContributions < ActiveRecord::Migration

  def self.up
    rename_column :contributions, :opt_out?, :opt_out
  end

  def self.down
    rename_column :contributions, :opt_out, :opt_out?
  end

end
