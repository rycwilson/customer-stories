class AddCompanyDefaultToAdwordsImages < ActiveRecord::Migration

  def change
    add_column :adwords_images, :company_default, :boolean, default: false
  end

end
