class AddContributorUnpublishedToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :contributor_unpublished, :boolean, default: false
  end
end
