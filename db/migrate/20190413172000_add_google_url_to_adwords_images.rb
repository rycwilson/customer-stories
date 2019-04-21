class AddGoogleUrlToAdwordsImages < ActiveRecord::Migration[5.0]
  def change
    add_column :adwords_images, :google_url, :string
  end
end
