class ChangeCompanyDefaultFeatureFlag < ActiveRecord::Migration

  def up
    change_column_default :companies, :feature_flag, from:'alpha', to:'beta'
  end

  def down
    change_column_default :companies, :feature_flag, from:'beta', to:'alpha'
  end

end
