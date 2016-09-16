class CreateVisitors < ActiveRecord::Migration

  def change

    drop_table :visitors  # old visitors table

    create_table :visitors do |t|
      t.string :name
      t.string :location
      t.references :company, index: true, foreign_key: true

      t.timestamps null: false
    end
  end

end
