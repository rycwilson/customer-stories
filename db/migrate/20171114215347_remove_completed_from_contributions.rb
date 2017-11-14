class RemoveCompletedFromContributions < ActiveRecord::Migration
  def change
    remove_column :contributions, :completed, :boolean
  end
end
