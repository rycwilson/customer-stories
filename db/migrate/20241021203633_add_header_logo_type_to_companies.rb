class AddHeaderLogoTypeToCompanies < ActiveRecord::Migration[6.1]
  def change
    add_column :companies, :header_logo_type, :string, default: 'LandscapeLogo'
  end
end
