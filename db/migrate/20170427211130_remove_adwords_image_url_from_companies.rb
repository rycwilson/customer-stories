class RemoveAdwordsImageUrlFromCompanies < ActiveRecord::Migration

  def change
    remove_column :companies, :adwords_image_url, :string
  end

end
