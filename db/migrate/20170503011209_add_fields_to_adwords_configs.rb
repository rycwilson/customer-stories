class AddFieldsToAdwordsConfigs < ActiveRecord::Migration
  def change
    add_column :adwords_configs, :topic_ad_group_id, :bigint
    add_column :adwords_configs, :retarget_ad_group_id, :bigint
  end
end
