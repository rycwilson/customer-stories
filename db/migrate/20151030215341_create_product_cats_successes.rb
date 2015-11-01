class CreateProductCatsSuccesses < ActiveRecord::Migration
  def change
    create_table :product_cats_successes do |t|
      t.references :success, index: true, foreign_key: true
      t.references :product_category, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
