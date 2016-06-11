class CreateStoryCategoriesSuccesses < ActiveRecord::Migration
  def change
    create_table :story_categories_successes do |t|
      t.references :story_category, index: true, foreign_key: true
      t.references :success, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
