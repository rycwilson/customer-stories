class CreateAdwordsImages < ActiveRecord::Migration

  def change
    create_table :adwords_images do |t|
      t.references :company, index: true, foreign_key: true
      t.string :url

      t.timestamps null: false
    end
  end

end
