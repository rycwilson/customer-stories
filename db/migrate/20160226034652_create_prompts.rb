class CreatePrompts < ActiveRecord::Migration
  def change
    create_table :prompts do |t|
      t.string :body
      t.references :success, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
