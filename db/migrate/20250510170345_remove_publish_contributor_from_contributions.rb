class RemovePublishContributorFromContributions < ActiveRecord::Migration[6.1]
  def change
    remove_column :contributions, :publish_contributor, :boolean
    remove_column :contributions, :contributor_unpublished, :boolean
  end
end
