class RenameCompanyBannerColors < ActiveRecord::Migration

  def change
    rename_column :companies, :nav_color_1, :header_color_1
    rename_column :companies, :nav_color_2, :header_color_2
    rename_column :companies, :nav_text_color, :header_text_color
  end

end
