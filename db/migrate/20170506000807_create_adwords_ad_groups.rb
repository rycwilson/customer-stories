class CreateAdwordsAdGroups < ActiveRecord::Migration
  def change
    create_table :adwords_ad_groups do |t|
      t.references :adwords_campaign, index: true, foreign_key: true
      t.integer :ad_group_id, limit: 8
      t.string :name
      t.string :status, default: 'PAUSED'

      t.timestamps null: false
    end
  end
end
