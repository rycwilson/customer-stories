class AddFeatureFlagToCompanies < ActiveRecord::Migration
  def change
    add_column :companies, :feature_flag, :string, default: 'alpha'
  end
end
