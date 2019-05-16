class CreateGoogleAdsHeadlines < ActiveRecord::Migration[5.0]
  def change
    create_table :google_ads_headlines do |t|
      t.string :headline
      t.references :company, foreign_key: true

      t.timestamps
    end
  end
end
