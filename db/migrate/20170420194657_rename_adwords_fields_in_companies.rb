class RenameAdwordsFieldsInCompanies < ActiveRecord::Migration

  def change
    rename_column :companies, :adwords_logo_image, :adwords_logo_url
    rename_column :companies, :adwords_mktg_image, :adwords_image_url
  end

end
