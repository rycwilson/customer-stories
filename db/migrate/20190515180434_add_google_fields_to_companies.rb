class AddGoogleFieldsToCompanies < ActiveRecord::Migration[5.0]
  def change
    add_column :companies, :gads_business_name, :string
    add_column :companies, :gads_default_cta_text, :string, default: 'Learn More'
    add_column :companies, :gads_default_main_color, :string, default: '#ffffff'
    add_column :companies, :gads_default_accent_color, :string, default: '#ffffff'
  end
end
