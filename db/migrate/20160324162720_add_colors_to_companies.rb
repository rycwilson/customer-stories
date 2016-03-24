class AddColorsToCompanies < ActiveRecord::Migration

  def change
    add_column :companies, :nav_color_1, :string, default: '#FBFBFB'
    add_column :companies, :nav_color_2, :string, default: '#85CEE6'
    add_column :companies, :nav_text_color, :string, default: '#333333'
  end

end
