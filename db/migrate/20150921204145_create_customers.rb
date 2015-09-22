class CreateCustomers < ActiveRecord::Migration
  def change
    create_table :customers do |t|
      t.string :name
      t.string :logo_img
      t.references :company, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
