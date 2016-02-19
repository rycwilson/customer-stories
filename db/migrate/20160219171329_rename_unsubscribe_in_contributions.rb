class RenameUnsubscribeInContributions < ActiveRecord::Migration

  def change
    rename_column :contributions, :opt_out, :unsubscribe
  end

end
