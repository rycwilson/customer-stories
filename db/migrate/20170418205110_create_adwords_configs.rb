class CreateAdwordsConfigs < ActiveRecord::Migration
  def change
    create_table :adwords_configs do |t|
      t.boolean :enable, default: false
      t.string :long_headline
      t.references :story, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
