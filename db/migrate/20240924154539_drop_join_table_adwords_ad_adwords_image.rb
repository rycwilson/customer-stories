class DropJoinTableAdwordsAdAdwordsImage < ActiveRecord::Migration[6.1]
  def change
    drop_join_table :adwords_ads, :adwords_images
  end
end
