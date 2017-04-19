class AddAdwordsFieldsToCompanies < ActiveRecord::Migration

  def change
    add_column :companies, :adwords_logo_image, :string
    add_column :companies, :adwords_mktg_image, :string
    add_column :companies, :adwords_short_headline, :string
  end

end
