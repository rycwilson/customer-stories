class AddAdwordsIdToAdwordsImages < ActiveRecord::Migration
  def change
    add_column :adwords_images, :adwords_media_id, :bigint
  end
end
