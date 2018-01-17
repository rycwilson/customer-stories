class ChangeDefaultHeaderColors < ActiveRecord::Migration
  def up
    change_column :companies, :header_color_1, :string, default: '#ffffff'
    change_column :companies, :header_color_2, :string, default: '#ffffff'
  end
  def down
    change_column :companies, :header_color_1, :string, default: "#FBFBFB"
    change_column :companies, :header_color_2, :string, default: "#85CEE6"
  end
end