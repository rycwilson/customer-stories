class CreateResults < ActiveRecord::Migration
  def change
    create_table :results do |t|
      t.string :description
      t.references :success, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
