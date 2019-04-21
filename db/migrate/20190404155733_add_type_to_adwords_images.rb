class AddTypeToAdwordsImages < ActiveRecord::Migration[5.0]
  def change
    # no point in having a default; just validate presence of type
    add_column :adwords_images, :type, :string
  end
end
