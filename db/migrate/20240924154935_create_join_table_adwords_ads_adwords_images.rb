class CreateJoinTableAdwordsAdsAdwordsImages < ActiveRecord::Migration[6.1]
  def change
    create_join_table :adwords_ads, :adwords_images do |t|
      t.index [:adwords_ad_id, :adwords_image_id]
    end
  end
end
