class RemovePreviewContributorFromContributions < ActiveRecord::Migration[6.1]
  def change
    remove_column :contributions, :preview_contributor, :boolean
  end
end
