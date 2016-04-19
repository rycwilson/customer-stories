class AddConstraintsToSlugs < ActiveRecord::Migration

  def change

    change_column_null :customers, :name, false
    change_column_null :products, :name, false
    change_column_null :stories, :title, false

    add_index :customers, [:name, :company_id], unique: true
    add_index :products, [:name, :company_id], unique: true
    add_index :stories, :title, unique: true

  end

end

# ref:
# https://www.viget.com/articles/adding-a-not-null-column-to-an-existing-table
# https://www.bignerdranch.com/blog/coding-rails-with-data-integrity/