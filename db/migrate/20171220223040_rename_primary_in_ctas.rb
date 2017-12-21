class RenamePrimaryInCtas < ActiveRecord::Migration
  def self.up
    rename_column :call_to_actions, :company_primary, :primary
  end
  def self.down
    rename_column :call_to_actions, :primary, :company_primary
  end
end
