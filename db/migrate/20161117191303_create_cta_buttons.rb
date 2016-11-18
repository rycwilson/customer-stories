class CreateCtaButtons < ActiveRecord::Migration
  def change
    create_table :cta_buttons do |t|
      t.string :btn_text
      t.string :color, default: '#fff'
      t.string :url
      t.references :company, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
