class RenameAdwordsMediaIdInAdwordsImages < ActiveRecord::Migration
  def change
    rename_column :adwords_images, :adwords_media_id, :media_id
  end
end
