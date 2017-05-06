class CreateAdwordsCampaigns < ActiveRecord::Migration
  def change
    create_table :adwords_campaigns do |t|
      t.references :company, index: true, foreign_key: true
      t.integer :campaign_id, limit: 8
      t.string :type
      t.string :name
      t.string :status, default: 'PAUSED'

      t.timestamps null: false
    end
  end
end
