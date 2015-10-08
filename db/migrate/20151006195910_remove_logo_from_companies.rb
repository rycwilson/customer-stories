class RemoveLogoFromCompanies < ActiveRecord::Migration
  def self.up
    remove_column :companies, :logo, :string
  end

  def self.down
    add_column :companies, :logo, :string
  end
end
