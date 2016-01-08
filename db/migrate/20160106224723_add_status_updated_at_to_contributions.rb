class AddStatusUpdatedAtToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :status_updated_at, :datetime
  end
end
