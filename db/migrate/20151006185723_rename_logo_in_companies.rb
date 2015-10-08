class RenameLogoInCompanies < ActiveRecord::Migration
  def self.up
    rename_column :companies, :logo_img, :logo
  end

  def self.down
    rename_column :companies, :logo, :logo_img
  end
end