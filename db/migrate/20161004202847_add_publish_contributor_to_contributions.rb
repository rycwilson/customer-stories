class AddPublishContributorToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :publish_contributor, :boolean, default: false
  end
end
