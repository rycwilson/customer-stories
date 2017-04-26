class RenameUrlInAdwordsimages < ActiveRecord::Migration

  def change
    rename_column :adwords_images, :url, :image_url
  end

end
