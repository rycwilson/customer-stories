class CreateProductsSuccesses < ActiveRecord::Migration
  def change
    create_table :products_successes do |t|
      t.references :success, index: true, foreign_key: true
      t.references :product, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
