class CreateSuccesses < ActiveRecord::Migration
  def change
    create_table :successes do |t|
      t.boolean :approved?, default: false
      t.boolean :published?, default: false
      t.references :customer, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
