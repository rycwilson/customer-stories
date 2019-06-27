class AddFieldsToAdwordsAds < ActiveRecord::Migration[5.0]
  def change
    add_column :adwords_ads, :main_color, :string
    add_column :adwords_ads, :accent_color, :string
  end
end
