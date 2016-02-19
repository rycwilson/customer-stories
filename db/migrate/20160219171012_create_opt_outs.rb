class CreateOptOuts < ActiveRecord::Migration
  def change
    create_table :opt_outs do |t|
      t.string :email

      t.timestamps null: false
    end
  end
end
