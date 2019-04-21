class ChangeCompanyDefaultInAdwordsImages < ActiveRecord::Migration[5.0]
  def change
    rename_column :adwords_images, :company_default, :default
  end
end
