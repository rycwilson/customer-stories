class AddAdwordsIdToAdwordsImages < ActiveRecord::Migration
  def change
    add_column :adwords_images, :adwords_id, :integer
  end
end
