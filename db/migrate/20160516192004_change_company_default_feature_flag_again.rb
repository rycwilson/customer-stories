class ChangeCompanyDefaultFeatureFlagAgain < ActiveRecord::Migration

  def up
    change_column_default :companies, :feature_flag, 'beta'
  end

  def down
    change_column_default :companies, :feature_flag, 'beta'
  end

end
