class CreateWidgetConfigs < ActiveRecord::Migration

  def change
    create_table :widgets do |t|
      t.references :company, index: true, foreign_key: true
      t.boolean :show, default: false
      t.integer :delay, default: 5000
      t.boolean :timeout, default: false
      t.integer :timeout_count, default: 5000
      t.string :tab_color, default: '#ddd'
      t.string :text_color, default: '#333'

      t.timestamps null: false
    end
  end

end
