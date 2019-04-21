class AddAssetIdToAdwordsImages < ActiveRecord::Migration[5.0]
  def change
    add_column :adwords_images, :asset_id, :bigint
  end
end
