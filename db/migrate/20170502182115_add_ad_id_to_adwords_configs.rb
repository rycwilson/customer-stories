class AddAdIdToAdwordsConfigs < ActiveRecord::Migration
  def change
    add_column :adwords_configs, :ad_id, :bigint
  end
end
