class ModifyFieldsAdwordsConfigs < ActiveRecord::Migration
  def change
    remove_column :adwords_configs, :ad_id
    add_column :adwords_configs, :retarget_ad_id, :bigint
    add_column :adwords_configs, :topic_ad_id, :bigint
  end
end
