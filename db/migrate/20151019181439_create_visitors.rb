class CreateVisitors < ActiveRecord::Migration
  def change
    create_table :visitors do |t|
      t.string :organization
      t.string :city
      t.string :state
      t.references :success, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
