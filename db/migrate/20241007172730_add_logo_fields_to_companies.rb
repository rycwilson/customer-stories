class AddLogoFieldsToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :square_logo_url, :string
    add_column :companies, :landscape_logo_url, :string
  end
end
