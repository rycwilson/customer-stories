class RenameLinkedinBoolInContributions < ActiveRecord::Migration

  def self.up
    rename_column :contributions, :linkedin_auth?, :linkedin
  end

  def self.down
    rename_column :contributions, :linkedin, :linkedin_auth?
  end

end
