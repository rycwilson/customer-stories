class RenameContributionsUserId < ActiveRecord::Migration
  def change
    rename_column :contributions, :user_id, :contributor_id
  end
end
