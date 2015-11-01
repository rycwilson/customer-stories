class CreateIndustriesSuccesses < ActiveRecord::Migration
  def change
    create_table :industries_successes do |t|
      t.references :industry_category, index: true, foreign_key: true
      t.references :success, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
