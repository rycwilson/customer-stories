class CreateVisitors < ActiveRecord::Migration

  def change

    drop_table :visitors do |t| # old visitors table
      t.string :organization
      t.string :city
      t.string :state
      t.integer :success_id
    end

    create_table :visitors do |t|
      t.string :name
      t.string :location
      t.references :company, index: true, foreign_key: true

      t.timestamps null: false
    end

  end

end
