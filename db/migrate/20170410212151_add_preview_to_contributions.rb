class AddPreviewToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :preview_contributor, :boolean, default: false
  end
end
