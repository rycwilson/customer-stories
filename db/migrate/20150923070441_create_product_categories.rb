class CreateProductCategories < ActiveRecord::Migration
  def change
    create_table :product_categories do |t|
      t.string :name
      t.references :company, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
