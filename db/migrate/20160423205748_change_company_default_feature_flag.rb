class ChangeCompanyDefaultFeatureFlag < ActiveRecord::Migration
  def change
    change_column :companies, :feature_flag, :string, default:"beta"
  end
end
