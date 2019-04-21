class AddFieldsToAdwordsAds < ActiveRecord::Migration[5.0]
  def change
    add_column :adwords_ads, :main_color, :string, default: '#ffffff'
    add_column :adwords_ads, :accent_color, :string, default: '#ffffff'
  end
end
