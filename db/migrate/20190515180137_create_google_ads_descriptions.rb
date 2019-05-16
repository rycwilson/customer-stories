class CreateGoogleAdsDescriptions < ActiveRecord::Migration[5.0]
  def change
    create_table :google_ads_descriptions do |t|
      t.string :description
      t.references :company, foreign_key: true

      t.timestamps
    end
  end
end
