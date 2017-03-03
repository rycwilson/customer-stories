class CreateWidgetConfigs < ActiveRecord::Migration

  def change
    create_table :widget_configs do |t|
      t.references :company, index: true, foreign_key: true
      t.string :tab_size, default: 'small'
      t.integer :delay, default: 3000
      t.boolean :show, default: false
      t.boolean :timeout, default: false
      t.integer :timeout_count, default: 3000
      t.string :tab_color, default: '#ddd'
      t.string :text_color, default: '#333'
      t.string :filter, default: 'none'

      t.timestamps null: false
    end
  end

end
