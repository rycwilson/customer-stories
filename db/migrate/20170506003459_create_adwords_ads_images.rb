class CreateAdwordsAdsImages < ActiveRecord::Migration
  def change
    create_table :adwords_ads_images do |t|
      t.references :adwords_ad, index: true, foreign_key: true
      t.references :adwords_image, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
