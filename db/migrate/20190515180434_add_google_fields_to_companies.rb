class AddGoogleFieldsToCompanies < ActiveRecord::Migration[5.0]
  def change
    add_column :companies, :gads_business_name, :string
    add_column :companies, :gads_default_cta_text, :string, default: 'See More'
    add_column :companies, :gads_default_main_color, :string, default: '#ffffff'
    add_column :companies, :gads_default_accent_color, :string, default: '#ffffff'
    add_column :companies, :gads_default_long_headline, :string
    remove_column :companies, :adwords_logo_media_id, :string
    remove_column :companies, :adwords_logo_url, :string
    rename_column :companies, :adwords_short_headline, :gads_default_short_headline
  end
end
