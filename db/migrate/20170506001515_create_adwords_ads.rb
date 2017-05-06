class CreateAdwordsAds < ActiveRecord::Migration
  def change
    create_table :adwords_ads do |t|
      t.references :adwords_ad_group, index: true, foreign_key: true
      t.references :story, index: true, foreign_key: true
      t.integer :ad_id, limit: 8
      t.string :status, default: 'PAUSED'
      t.string :approval_status, default: 'UNCHECKED'
      t.string :long_headline

      t.timestamps null: false
    end
  end
end
