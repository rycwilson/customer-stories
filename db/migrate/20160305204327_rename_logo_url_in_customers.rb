class RenameLogoUrlInCustomers < ActiveRecord::Migration

  def change
    rename_column :customers, :logo_img, :logo_url
  end

end
