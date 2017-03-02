class CreateWidgetConfigs < ActiveRecord::Migration

  def change
    create_table :widget_configs do |t|
      t.references :company, index: true, foreign_key: true
      t.string :tab_size, default: 'small'
      t.integer :load_delay, default: 3000
      t.boolean :open_on_load, default: false
      t.boolean :open_on_load_timeout, default: false
      t.integer :timeout_delay, default: 3000
      t.string :tab_color, default: '#ddd'
      t.string :text_color, default: '#333'

      t.timestamps null: false
    end
  end

end
