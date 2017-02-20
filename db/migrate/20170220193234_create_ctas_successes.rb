class CreateCtasSuccesses < ActiveRecord::Migration
  def change
    create_table :ctas_successes do |t|
      t.references :call_to_action, index: true, foreign_key: true
      t.references :success, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
