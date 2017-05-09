class AddAdwordsLogoMediaIdToCompanies < ActiveRecord::Migration
  def change
    add_column :companies, :adwords_logo_media_id, :bigint
  end
end
