class AddGoogleFieldsToAdwordsAds < ActiveRecord::Migration[5.0]
  def change
    # all default values will be provided by the company model
    add_column :adwords_ads, :description, :string
    add_column :adwords_ads, :cta_text, :string
    add_column :adwords_ads, :short_headline, :string
  end
end
