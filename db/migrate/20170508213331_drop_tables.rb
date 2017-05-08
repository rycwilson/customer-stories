class DropTables < ActiveRecord::Migration

  def change
    drop_table(:sponsored_stories_images, {}) {}
    drop_table(:adwords_configs, {}) {}
    drop_table(:industries_successes, {}) {}
    drop_table(:industry_categories, {}) {}
    drop_table(:cta_buttons, {}) {}
    drop_table(:product_cats_successes, {}) {}
    drop_table(:product_categories, {}) {}
  end

end
