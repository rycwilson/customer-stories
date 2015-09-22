class CreateStories < ActiveRecord::Migration
  def change
    create_table :stories do |t|
      t.string :title
      t.text :quote
      t.text :quot_attr
      t.string :embed_url
      t.text :situation
      t.text :challenge
      t.text :solution
      t.text :results
      t.references :success, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
