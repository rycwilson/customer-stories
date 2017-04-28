class ChangeEnableInAdwordsConfigs < ActiveRecord::Migration

  def change
    rename_column :adwords_configs, :enable, :enabled
  end

end
