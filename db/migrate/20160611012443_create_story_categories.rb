class CreateStoryCategories < ActiveRecord::Migration

  def change
    create_table :story_categories do |t|
      t.string :name
      t.string :slug
      t.references :company, index: true, foreign_key: true

      t.timestamps null: false
    end

    add_index :story_categories, [:name, :company_id], unique: true

  end

end
