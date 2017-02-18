class DropProductCategoriesTable < ActiveRecord::Migration

  def change
    def up
      drop_table :product_categories
      drop_table :product_cats_success
    end

    def down
      raise ActiveRecord::IrreversibleMigration
    end
  end

end
